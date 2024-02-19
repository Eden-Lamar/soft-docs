import {useEffect, useRef, useState} from "react"
import Quill from "quill";
import "quill/dist/quill.snow.css";
import {io} from 'socket.io-client'
import { useParams } from "react-router-dom";

const SAVE_INTERVAL_MS = 2000;

// Options for the Quill editor toolbar
const TOOLBAR_OPTIONS = [
	[{header: [1, 2, 3, 4, 5, 6, false]}],
	[{font: [] }],
	[{list: 'ordered'}, {list: 'bullet'}],
	['bold', 'italic', 'underline'],
	[{ color: [] }, { background: [] }],
	[{ script: "sub" }, { script: "super" }],
	[{ align: [] }],
	['link', 'image', "blockquote", "code-block"],
	['clean'],
]

export default function TextEditor() {
	const { id: documentId } = useParams(); // Extracting the document ID from the URL parameters
    const [socket, setSocket] = useState(); // State variable for the socket connection
    const [quill, setQuill] = useState(); // State variable for the Quill editor instance
    const wrapperRef = useRef(null); // Reference to the Quill editor container
    const isEditorInitialized = useRef(false); // Flag to track if the editor has been initialized

	// Effect to handle changes received from other users via socket
	useEffect(() => {
		if (socket == null || quill == null) return;

		const handler = (delta) => { 
			quill.updateContents(delta)
		}

		socket.on('receive-changes', handler)

		return () => {
			socket.off('receive-change', handler)
		}
	}, [socket, quill]);
	
	// Effect to load the initial document content from the server
	useEffect(() => {
		if (socket == null || quill == null) return;		
		
		socket.once("load-document", document => {
			quill.setContents(document)
			quill.enable()
		})

		socket.emit("get-document", documentId)
	}, [socket, quill, documentId]);

	// Effect to periodically save the document content to the server
	useEffect(() => {
		if (socket == null || quill == null) return;
		
		const interval = setInterval(() => {
			socket.emit("save-document", quill.getContents())
		}, SAVE_INTERVAL_MS)

		return () => {
			clearInterval(interval)
		}
		
	}, [socket, quill]);

    // Effect to handle text changes made by the local user and emit them via socket
	useEffect(() => {
		if (socket == null || quill == null) return;

		const handler = (delta, oldDelta, source) => { 
			if (source !== 'user') return;
			socket.emit('send-changes', delta)
		}

		quill?.on('text-change', handler)

		return () => {
			quill?.off('text-change', handler)
		}
	}, [socket, quill]);

	// Effect to initialize the socket connection and Quill editor
	useEffect(() => {
		const s = io("http://localhost:3001")
		setSocket(s)

		if (!isEditorInitialized.current) {
			const editor = document.createElement('div'); // Creating a div element for the Quill editor
            wrapperRef.current.appendChild(editor); // Appending the editor div to the wrapper element
            const q = new Quill(editor, { theme: "snow", modules: { toolbar: TOOLBAR_OPTIONS } }); // Initializing Quill editor instance
            q.disable(); // Disabling the editor until the document content is loaded
            q.setText("Loading..."); // Displaying a loading message in the editor
            setQuill(q); // Setting the Quill editor instance in state
            isEditorInitialized.current = true; // Updating the initialization flag
		}
		
		return () => {
			s.disconnect() // Disconnecting the socket connection when component unmounts
		}
	}, []);

	// Returning the Quill editor container
	return (
		<div className="container" ref={wrapperRef}></div>
	)
}
