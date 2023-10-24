const mongoose = require('mongoose');

const TopicSchema = new mongoose.Schema(
  {
    topicId: { type: String, required: true },
    topicName: { type: String, required: true }
  },
  { collection: 'topics', timestamps: true }
);

const Topic = mongoose.model('TopicSchema', TopicSchema);

module.exports = Topic;
