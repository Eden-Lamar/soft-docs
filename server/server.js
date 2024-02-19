// MY IMPORTS
const express = require("express")
const { Server } = require("socket.io")
require("dotenv").config()
const mongoose = require("mongoose")
const Document = require('./Document')


// Connect to db
async function connectToDatabase() {
	try {
		const connect = await mongoose.connect(process.env.MONGO_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useFindAndModify: false,
			useCreateIndex: true,
		});

		if (connect) {
			console.log("DB CONNECTED\n");
		} else {
			console.log("Failed to connect to the database");
		}
	} catch (error) {
		console.error("Error connecting to the database:", error);
	}
}

connectToDatabase();



// INITIALIZE APP
const app = express()

// APP CONFIGURATION MIDDLEWARE
app.use(express.json())


const port = process.env.PORT || 3001

const server = app.listen(port, () => {
	console.log(`THE FORCE IS WITH YOU ON PORT ${port}\n`)
})

const io = new Server(server, {
	cors: {
		origin: "http://localhost:3000",
		method: ["GET", "POST"]
	},
})

const defaultValue = ""

// Handling socket connections
io.on("connection", (socket) => {
	console.log("connected\n")

	socket.on('get-document', async documentId => {
		const document = await findOrCreateDocument(documentId);
		socket.join(documentId)
		socket.emit('load-document', document.data)

		socket.on('send-changes', delta => {
			socket.broadcast.to(documentId).emit('receive-changes', delta)
		})

		socket.on("save-document", async data => {
			await Document.findByIdAndUpdate(documentId, { data })
		})
	})

})

// Function to find or create a document in the database
async function findOrCreateDocument(id) {
	if (id == null) return

	const document = await Document.findById(id)
	if (document) return document
	return Document.create({ _id: id, data: defaultValue })
}