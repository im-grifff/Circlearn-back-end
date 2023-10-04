const mongoose = require('mongoose');

//skema data dari database mongodb (dibutuhkan untuk melakukan crud dengan mongoose)
const UserSchema = new mongoose.Schema(
	{
		username: { type: String, required: true, unique: true },
		email : { type: String, required: true },
		password: { type: String, required: true },
		adminkelas: [{ type: mongoose.Schema.Types.ObjectId, ref: "RundingSchema" }],
		pesertakelas: [{ type: mongoose.Schema.Types.ObjectId, ref: "RundingSchema" }]
	},
	{ collection: 'users' }
)

const User = mongoose.model('UserSchema', UserSchema);

module.exports = User;
