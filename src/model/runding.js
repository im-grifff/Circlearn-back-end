const mongoose = require("mongoose");

//skema data dari database mongodb (dibutuhkan untuk melakukan crud dengan mongoose)
const RundingSchema = new mongoose.Schema(
  {
    logo_grup: { type: String, required: true },
    subject: { type: String, required: true },
    deskripsi: { type: String, required: true },
    jenisRunding: { type: String, required: true },
    administrator: [{ type: mongoose.Schema.Types.ObjectId, ref: "UserSchema" }],
    admin_username: [{type: String}],
    peserta: [{ type: mongoose.Schema.Types.ObjectId, ref: "UserSchema" }],
    meetDateStart : { type: Date },
    meetDateEnd : { type: Date },
    meetLink: { type: String },
    meetTime: { type: String },
  },
  { collection: "rundings", timestamps: true }
);
//jenisRunding meliputi : Sains, Teknologi, Programming, Agrikultur, Bisnis, Kesehatan, Debat, Hiburan, Kuliner, Olahraga, Other

const Runding = mongoose.model("RundingSchema", RundingSchema);

module.exports = Runding;
