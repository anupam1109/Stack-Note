var mongoose = require('mongoose');

var noteSchema = mongoose.Schema({
	title  	  : String,	
	content   : String
});

module.exports = mongoose.model("Note", noteSchema);