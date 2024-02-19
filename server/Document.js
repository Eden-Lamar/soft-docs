const { Schema, model } = require("mongoose")

// Defining the Document schema
const Document = new Schema({
	_id: String,
	data: Object
})

module.exports = model("Document", Document)