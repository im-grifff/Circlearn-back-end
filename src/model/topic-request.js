const mongoose = require('mongoose');

const TopicRequestSchema = new mongoose.Schema(
  {
    topicId: { type: String, required: true },
    topicName: { type: String, required: true }
  },
  { collection: 'topics-request', timestamps: true }
);

const Topic = mongoose.model('TopicRequestSchema', TopicRequestSchema);

module.exports = Topic;
