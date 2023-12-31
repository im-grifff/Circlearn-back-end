const router = require('express').Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const auth = require('../middleware/auth');
const { uploadLogo } = require('../middleware/uploadLogo');
const { storeImage } = require('../middleware/storeImage');
const { putStoreImage } = require('../middleware/putStoreImage');
const verifyUser = require('../middleware/verifyUser');
const verifyAdmin = require('../middleware/verifyAdmin');
const verifyPost = require('../middleware/verifyPost');
const verifyCommenter = require('../middleware/verifyCommenter');
const verifyCommentAuthor = require('../middleware/verifyCommentAuthor');
const commentLiked = require('../middleware/commentLiked');

const User = require('../model/user');
const Runding = require('../model/runding');
const Posts = require('../model/posts');
const Comment = require('../model/comment');
const Replies = require('../model/replies');
const Topics = require('../model/topic');
const TopicRequest = require('../model/topic-request');

function selectFewerFields(dataObject) {
  const { _id, logo_grup, subject, jenisRunding, peserta, admin_username } =
    dataObject;
  return { _id, logo_grup, subject, jenisRunding, peserta, admin_username };
}

/*secret token untuk json web token, hasil token yang di encode dengan base64 akan
diberikan ke client yang melakukan login*/
const JWT_SECRET =
  '$2a$10$YJYHqw1XxugfTGHOWL.GSODjNJlLOfic8MWs5T8jbKxPDMDTvm5Ti';

//mendapatkan list user dari database runding_database
router.get('/user/userList', async (req, res) => {
  const token = req.header('auth-token');

  try {
    const user = jwt.verify(token, JWT_SECRET);
    const username = user.username;

    const findUser = await User.findOne({ username }).lean();

    if (!(findUser.username == 'admin')) {
      res.status(403);
      return res.json({ status: 'error', error: 'Access denied' });
    }

    User.find({}, function (err, users) {
      res.send(users);
    });
  } catch (error) {
    if (error.message === 'jwt malformed' || 'invalid token') {
      res.status(400);
      res.json({ status: 'error', message: 'Invalid token' });
    } else {
      console.log(error);
      res.status(500);
      res.json({ status: 'error', message: 'Server error' });
    }
  }
});

//mendapatkan contoh data, hanya dapat direquest dengan request yang berisi body json web token hasil login
router.get('/getExampleData', auth, async (req, res) => {
  try {
    res.json({
      status: 'ok',
      data: { kelas: ['kelasdiskusi1', 'kelasdiskusi2'] }
    });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

//Login Route

router.post('/user/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username }).lean();

  try {
    if (!user) {
      res.status(401);
      return res.json({ status: 'error', message: 'Invalid username' });
    }

    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign(
        {
          id: user._id,
          username: user.username
        },
        JWT_SECRET
      );

      return res.json({ status: 'ok', data: token });
    }

    res.status(401);
    res.json({ status: 'error', message: 'Invalid password' });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

router.get('/user/data', auth, async (req, res) => {
  const user = await User.findOne({ _id: req.userloggedIn.id }).lean();

  try {
    if (!user) {
      return res.json({
        status: 'error',
        message: 'You are not a registered user'
      });
    }

    res.json({
      status: 'ok',
      message: 'Welcome user, here is your data',
      data: user
    });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

// Register User Route

router.post('/user/register', async (req, res) => {
  const { username, email, password: plainTextPassword } = req.body;
  const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

  // Validation checks
  if (!username || typeof username !== 'string') {
    res.status(400);
    return res.json({ status: 'error', message: 'Invalid username' });
  }

  if (!email || !re.test(email)) {
    res.status(400);
    return res.json({ status: 'error', message: 'Invalid email' });
  }

  if (!plainTextPassword || typeof plainTextPassword !== 'string') {
    res.status(400);
    return res.json({ status: 'error', message: 'Invalid password' });
  }

  if (plainTextPassword.length < 6) {
    res.status(400);
    return res.json({
      status: 'error',
      message: 'Password too small. Should be at least 6 characters'
    });
  }

  // Check if the email or username already exists in the database
  try {
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      res.status(400);
      return res.json({
        status: 'error',
        message: 'Email or username already in use'
      });
    }
  } catch (error) {
    res.status(500);
    return res.json({ status: 'error', message: error });
  }

  // Continue with user creation if email and username are not duplicates
  const password = await bcrypt.hash(plainTextPassword, 10);

  try {
    const response = await User.create({
      username,
      email,
      password
    });
    console.log('User created successfully: ', response);
    res.status(201);
    res.json({ status: 'ok', message: 'User created' });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400);
      return res.json({
        status: 'error',
        message: 'Email or username already in use'
      });
    }
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

// user edit profile route

router.put('/user/edit', auth, async (req, res) => {
  try {
    const { username, email, password: plainTextPassword } = req.body;
    const user = await User.findOne({ _id: req.userloggedIn.id }).lean();

    if (!user) {
      res.status(401);
      return res.json({ status: 'error', message: 'Invalid user' });
    }

    if (username) {
      await User.updateOne(
        { _id: mongoose.Types.ObjectId(req.userloggedIn.id) },
        { username: username }
      );
    }

    if (email) {
      await User.updateOne(
        { _id: mongoose.Types.ObjectId(req.userloggedIn.id) },
        { email: email }
      );
    }

    if (plainTextPassword) {
      const password = await bcrypt.hash(plainTextPassword, 10);
      await User.updateOne(
        { _id: mongoose.Types.ObjectId(req.userloggedIn.id) },
        { password: password }
      );
    }

    res.json({ status: 'ok', message: 'user updated' });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

// Runding Route

router.get('/runding', auth, async (req, res) => {
  try {
    const dataRunding = await Runding.find({});
    const fewerRunding = dataRunding.map(selectFewerFields);
    res.json({ status: 'ok', data: fewerRunding });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

router.get('/runding/sortByCreated', auth, async (req, res) => {
  try {
    const dataRunding = await Runding.find({}).sort({ createdAt: -1 });
    const fewerRunding = dataRunding.map(selectFewerFields);
    res.json({ status: 'ok', data: fewerRunding });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

router.get('/runding/sortByMembers', auth, async (req, res) => {
  try {
    const dataRunding = await Runding.aggregate()
      .addFields({ length: { $size: `$peserta` } })
      .sort({ length: -1 });
    const fewerRunding = dataRunding.map(selectFewerFields);
    res.json({ status: 'ok', data: fewerRunding });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

router.get('/runding/admined', auth, async (req, res) => {
  try {
    const userData = await User.findOne({ _id: req.userloggedIn.id });
    const dataRunding = await Runding.find({
      _id: { $in: userData.adminkelas }
    });
    res.json({ status: 'ok', data: dataRunding });
  } catch (error) {
    console.log(error);
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

router.get('/runding/joined', auth, async (req, res) => {
  try {
    const userData = await User.findOne({ _id: req.userloggedIn.id });
    const userKelas = await userData.adminkelas.concat(userData.pesertakelas);
    const dataRunding = await Runding.find({ _id: { $in: userKelas } });
    res.json({ status: 'ok', data: dataRunding });
  } catch (error) {
    console.log(error);
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

router.get('/runding/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const dataRunding = await Runding.findOne({ _id: id });
    const memberRunding = await Runding.findOne({
      _id: id,
      peserta: req.userloggedIn.id
    }).lean();
    const adminRunding = await Runding.findOne({
      _id: id,
      administrator: req.userloggedIn.id
    }).lean();
    if (!dataRunding) {
      res.status(404);
      return res.json({ status: 'error', message: 'No group with that id' });
    }
    if (adminRunding) {
      return res.json({
        status: 'ok',
        message: 'these are the group details, you are admin',
        author: true,
        data: dataRunding
      });
    }
    if (memberRunding) {
      return res.json({
        status: 'ok',
        message: 'these are the group details',
        member: true,
        data: dataRunding
      });
    }
    res.json({
      status: 'ok',
      message: 'these are the group details, you are not part of this group',
      member: false,
      data: {
        _id: dataRunding._id,
        subject: dataRunding.subject,
        logo_grup: dataRunding.logo_grup,
        jenisRunding: dataRunding.jenisRunding,
        peserta: dataRunding.peserta,
        admin_username: dataRunding.admin_username
      }
    });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

router.get('/runding/administrator/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const dataRunding = await Runding.findOne({ _id: id });
    const memberRunding = await Runding.findOne({
      _id: id,
      peserta: req.userloggedIn.id
    }).lean();
    const adminRunding = await Runding.findOne({
      _id: id,
      administrator: req.userloggedIn.id
    }).lean();
    const adminData = await User.findOne({ _id: dataRunding.administrator[0] });
    if (!dataRunding) {
      res.status(404);
      return res.json({ status: 'error', message: 'No group with that id' });
    }
    if (adminRunding) {
      return res.json({
        status: 'ok',
        message: "these are the admin's details, you are admin",
        author: true,
        data: { username: adminData.username, email: adminData.email }
      });
    }
    if (memberRunding) {
      return res.json({
        status: 'ok',
        message: "these are the admin's details",
        member: true,
        data: { username: adminData.username, email: adminData.email }
      });
    }
    res.json({
      status: 'ok',
      message: 'You are not part of this group',
      member: false,
      data: {}
    });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

router.post(
  '/runding/create',
  auth,
  uploadLogo('logo_form'),
  storeImage,
  async (req, res) => {
    try {
      const { subject_form, deskripsi_form, jenis_form } = req.body;
      /*const url = req.protocol + "://" + req.get("host");*/
      const url = req.imageURL;
      const newRunding = await Runding.create({
        logo_grup: url,
        subject: subject_form,
        deskripsi: deskripsi_form,
        jenisRunding: jenis_form,
        administrator: [req.userloggedIn.id],
        admin_username: [req.userloggedIn.username]
      });
      console.log('Group created successfully: ', newRunding);

      const class_id = newRunding._id;

      await User.updateOne(
        { _id: req.userloggedIn.id },
        {
          $push: { adminkelas: class_id }
        }
      );

      const io = req.app.get('socketio');
      io.emit(
        'new_group',
        `New Runding Created at http://shiny-taiyaki-bddd2f.netlify.app/ruang/${class_id}`
      );
      res.status(201);
      res.json({
        status: 'ok',
        message: 'new group created',
        data: newRunding
      });
    } catch (error) {
      res.status(500);
      res.json({ status: 'error', message: error });
    }
  }
);

router.put(
  '/runding/:id',
  auth,
  verifyAdmin,
  uploadLogo('logo_form'),
  putStoreImage,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { subject_form, deskripsi_form, jenis_form } = req.body;
      let url = undefined;
      if (req.imageURL) {
        url = req.imageURL;
      }

      await Runding.updateOne(
        { _id: mongoose.Types.ObjectId(id) },
        {
          logo_grup: url,
          subject: subject_form,
          deskripsi: deskripsi_form,
          jenisRunding: jenis_form
        }
      );
      res.json({ status: 'ok', message: 'group updated', author: true });
    } catch (error) {
      res.status(500);
      res.json({ status: 'error', message: error });
    }
  }
);

router.put('/runding/join/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const foundRunding = await Runding.find({
      _id: id,
      peserta: req.userloggedIn.id
    }).lean();
    const foundAdmin = await Runding.find({
      _id: id,
      administrator: req.userloggedIn.id
    }).lean();
    if (foundRunding.length != 0) {
      return res.json({
        status: 'redundant',
        message: 'you already joined the group',
        member: true,
        data: foundRunding
      });
    }
    if (foundAdmin.length != 0) {
      return res.json({
        status: 'redundant',
        message: 'you are admin of this group',
        author: true,
        data: foundRunding
      });
    }
    const dataRundingJoined = await Runding.updateOne(
      { _id: mongoose.Types.ObjectId(id) },
      {
        $push: { peserta: req.userloggedIn.id }
      }
    );

    await User.updateOne(
      { _id: mongoose.Types.ObjectId(req.userloggedIn.id) },
      {
        $push: { pesertakelas: id }
      }
    );

    res.json({
      status: 'ok',
      message: 'you joined the group',
      member: true,
      data: dataRundingJoined
    });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

router.put('/runding/leave/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const dataRundingLeft = await Runding.updateOne(
      { _id: mongoose.Types.ObjectId(id) },
      {
        $pull: { peserta: req.userloggedIn.id }
      }
    );

    await User.updateOne(
      { _id: mongoose.Types.ObjectId(req.userloggedIn.id) },
      {
        $pull: { pesertakelas: id }
      }
    );

    res.json({
      status: 'ok',
      message: 'you left the group',
      member: false,
      data: dataRundingLeft
    });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

router.delete('/runding/:id', auth, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    // const getRunding = await Runding.findOne({
    //   _id: mongoose.Types.ObjectId(id),
    // });
    // const filenames = fs.readdirSync(path.join(__dirname, "../images"));
    // filenames.map((file) => {
    //   if (
    //     file ==
    //     getRunding.logo_grup.substring(
    //       getRunding.logo_grup.lastIndexOf("/") + 1
    //     )
    //   ) {
    //     fs.unlinkSync(path.join(__dirname, "../images/", file));
    //   }
    // });
    const deleted = await Runding.deleteOne({ _id: id });
    if (!deleted.deletedCount) {
      res.status(404);
      res.json({ status: 'error', message: 'no group found' });
      return;
    }

    await User.updateMany(
      {},
      {
        $pull: {
          pesertakelas: id,
          adminkelas: id
        }
      }
    );
    res.json({ status: 'ok', message: 'group deleted', author: true });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

router.put('/runding/newmeeting/:id', auth, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { meeting_form } = req.body;
    const now = new Date();
    const later = new Date();
    later.setHours(later.getHours() + 1);
    const dataRundingUpdated = await Runding.updateOne(
      { _id: mongoose.Types.ObjectId(id) },
      {
        meetLink: meeting_form,
        meetDateStart: now,
        meetDateEnd: later,
        meetTime: `Meeting ${meeting_form} starting at ${now} is going to end at ${later}`
      }
    );

    res.json({
      status: 'ok',
      message: 'meeting added',
      data: dataRundingUpdated,
      meetexpire: `${now}`
    });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

router.put(
  '/runding/removemeeting/:id',
  auth,
  verifyAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const dataRundingUpdated = await Runding.updateOne(
        { _id: mongoose.Types.ObjectId(id) },
        {
          meetLink: null,
          meetDateStart: null,
          meetDateEnd: null,
          meetTime: null
        }
      );

      res.json({
        status: 'ok',
        message: 'meeting deleted',
        data: dataRundingUpdated
      });
    } catch (error) {
      res.status(500);
      res.json({ status: 'error', message: error });
    }
  }
);

// Posts/Questions Route

router.get('/runding/posts/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const dataRundingPost = await Posts.find({ runding_id: id });
    res.json({ status: 'ok', data: dataRundingPost });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

router.get('/runding/posts/tags/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { tag_search } = req.body;
    const dataRundingPost = await Posts.find({
      runding_id: id,
      tags: tag_search
    });
    res.json({ status: 'ok', data: dataRundingPost });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

router.post('/runding/posts/create/:id', auth, verifyUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { title_form, description_form, tags_form } = req.body;
    const newPost = await Posts.create({
      runding_id: mongoose.Types.ObjectId(id),
      title: title_form,
      description: description_form,
      tags: tags_form,
      author: [req.userloggedIn.id],
      username_author: req.userloggedIn.username
    });
    res.status(201);
    res.json({
      status: 'ok',
      message: 'new question/post created',
      member: true,
      data: newPost
    });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

router.put('/posts/:postid', auth, verifyPost, async (req, res) => {
  try {
    const { postid } = req.params;
    const { title_form, description_form, tags_form } = req.body;
    const newPost = await Posts.updateOne(
      {
        _id: mongoose.Types.ObjectId(postid)
      },
      {
        title: title_form,
        description: description_form,
        tags: tags_form
      }
    );

    res.json({
      status: 'ok',
      message: 'post updated',
      author: true,
      data: newPost
    });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});
router.put('/admin/posts/:postid', auth, async (req, res) => {
  try {
    const { postid } = req.params;
    const { title_form, description_form, tags_form } = req.body;
    const newPost = await Posts.updateOne(
      {
        _id: mongoose.Types.ObjectId(postid)
      },
      {
        title: title_form,
        description: description_form,
        tags: tags_form
      }
    );

    res.json({
      status: 'ok',
      message: 'post updated',
      author: true,
      data: newPost
    });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

router.delete('/posts/:postid', auth, verifyPost, async (req, res) => {
  try {
    const { postid } = req.params;
    await Posts.deleteOne({
      _id: mongoose.Types.ObjectId(postid)
    });

    res.json({ status: 'ok', message: 'question deleted', author: true });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

router.delete('/admin/posts/:postid', auth, async (req, res) => {
  try {
    const { postid } = req.params;
    await Posts.deleteOne({
      _id: mongoose.Types.ObjectId(postid)
    });

    res.json({ status: 'ok', message: 'question deleted', author: true });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

// Comments Route

router.get('/posts/comments/:postid', auth, async (req, res) => {
  try {
    const { postid } = req.params;
    const dataPost = await Posts.find({ _id: postid });
    const dataRundingComments = await Comment.find({ post_id: postid });
    res.json({
      status: 'ok',
      data: { post: dataPost, comments: dataRundingComments }
    });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

router.get('/posts/comments/sortByLikes/:postid', auth, async (req, res) => {
  try {
    const { postid } = req.params;
    const dataPost = await Posts.find({ _id: postid });
    const dataRundingComments = await Comment.aggregate([
      { $match: { post_id: mongoose.Types.ObjectId(postid) } }
    ])
      .addFields({ length: { $size: `$likes` } })
      .sort({ length: -1 });
    res.json({
      status: 'ok',
      data: { post: dataPost, comments: dataRundingComments }
    });
  } catch (error) {
    console.log(error);
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

router.post(
  '/posts/comments/create/:postid',
  auth,
  verifyCommenter,
  async (req, res) => {
    try {
      const { postid } = req.params;
      const { content_form } = req.body;

      // Use lean() to convert the result to a plain JavaScript object
      const postComment = await Posts.findOne({ _id: postid }).lean();

      const rundingId = postComment.runding_id.toString();
      const newComment = await Comment.create({
        post_id: mongoose.Types.ObjectId(postid),
        runding_id: mongoose.Types.ObjectId(rundingId),
        content: content_form,
        author_id: [req.userloggedIn.id],
        author_username: [req.userloggedIn.username]
      });

      await Posts.updateOne(
        { _id: mongoose.Types.ObjectId(postid) },
        {
          $push: { replies: newComment._id }
        }
      );

      res.status(201);
      res.json({
        status: 'ok',
        message: 'Comment created',
        member: true,
        data: newComment
      });
    } catch (error) {
      res.status(500);
      res.json({ status: 'error', message: error.toString() });
    }
  }
);

router.post('/admin/posts/comments/create/:postid', auth, async (req, res) => {
  try {
    const { postid } = req.params;
    const { content_form } = req.body;

    // Use lean() to convert the result to a plain JavaScript object
    const postComment = await Posts.findOne({ _id: postid }).lean();

    const rundingId = postComment.runding_id.toString();
    const newComment = await Comment.create({
      post_id: mongoose.Types.ObjectId(postid),
      runding_id: mongoose.Types.ObjectId(rundingId),
      content: content_form,
      author_id: [req.userloggedIn.id],
      author_username: [req.userloggedIn.username]
    });

    await Posts.updateOne(
      { _id: mongoose.Types.ObjectId(postid) },
      {
        $push: { replies: newComment._id }
      }
    );

    res.status(201);
    res.json({
      status: 'ok',
      message: 'Comment created',
      member: true,
      data: newComment
    });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error.toString() });
  }
});

router.put(
  '/comments/like/:commentid',
  auth,
  commentLiked,
  async (req, res) => {
    try {
      const { commentid } = req.params;
      const commentLike = await Comment.findOne({ _id: commentid });
      if (!commentLike) return res.status(400).send("Comment doesn't exists");
      await Comment.updateOne(
        { _id: mongoose.Types.ObjectId(commentid) },
        {
          $push: { likes: req.userloggedIn.id }
        }
      );

      res.json({ status: 'ok', message: 'Comment liked' });
    } catch (error) {
      res.status(500);
      res.json({ status: 'error', message: error });
    }
  }
);

router.put('/comments/unlike/:commentid', auth, async (req, res) => {
  try {
    const { commentid } = req.params;
    const commentLike = await Comment.findOne({ _id: commentid });
    if (!commentLike) return res.status(400).send("Comment doesn't exists");
    await Comment.updateOne(
      { _id: mongoose.Types.ObjectId(commentid) },
      {
        $pull: { likes: req.userloggedIn.id }
      }
    );

    res.json({ status: 'ok', message: 'Remove like success' });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

router.delete(
  '/comments/:commentid',
  auth,
  verifyCommentAuthor,
  async (req, res) => {
    try {
      const { commentid } = req.params;
      await Comment.deleteOne({ _id: mongoose.Types.ObjectId(commentid) });

      res.json({ status: 'ok', message: 'Comment Deleted', author: true });
    } catch (error) {
      res.status(500);
      res.json({ status: 'error', message: error });
    }
  }
);

router.delete('/admin/comments/:commentid', auth, async (req, res) => {
  try {
    const { commentid } = req.params;
    await Comment.deleteOne({ _id: mongoose.Types.ObjectId(commentid) });

    res.json({ status: 'ok', message: 'Comment Deleted', author: true });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

router.put(
  '/comments/:commentid',
  auth,
  verifyCommentAuthor,
  async (req, res) => {
    try {
      const { commentid } = req.params;
      const { content_form } = req.body;

      await Comment.updateOne(
        { _id: mongoose.Types.ObjectId(commentid) },
        { content: content_form }
      );

      res.json({ status: 'ok', message: 'Comment Edited', author: true });
    } catch (error) {
      res.status(500);
      res.json({ status: 'error', message: error });
    }
  }
);

router.put('/admin/comments/:commentid', auth, async (req, res) => {
  try {
    const { commentid } = req.params;
    const { content_form } = req.body;

    await Comment.updateOne(
      { _id: mongoose.Types.ObjectId(commentid) },
      { content: content_form }
    );

    res.json({ status: 'ok', message: 'Comment Edited', author: true });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

// Replies Route

router.get('/post/comments/reply/:postid', auth, async (req, res) => {
  try {
    const { postid } = req.params;
    const replies = await Replies.find({ post_id: postid });
    if (!replies) {
      return res.status(404).send("Comment/post doesn't exists");
    }

    res.json({ status: 'ok', data: replies });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

router.get(
  '/post/comments/reply/checkMember/:postid',
  auth,
  verifyCommenter,
  async (req, res) => {
    try {
      const { postid } = req.params;
      const replies = await Replies.find({ post_id: postid });
      if (!replies) {
        return res.status(404).send("Comment/post doesn't exists");
      }

      res.json({
        status: 'ok',
        message: "You are part of this post's group!",
        member: true,
        data: replies
      });
    } catch (error) {
      res.status(500);
      res.json({ status: 'error', message: error });
    }
  }
);

router.get('/comments/reply/:commentid', auth, async (req, res) => {
  try {
    const { commentid } = req.params;
    const replies = await Replies.find({ comment_id: commentid });
    if (!replies) {
      return res.status(404).send("Comment doesn't exists");
    }

    res.json({ status: 'ok', data: replies });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

router.post('/comments/reply/:commentid', auth, async (req, res) => {
  try {
    const { commentid } = req.params;
    const { content_form } = req.body;

    const relatedComment = await Comment.findOne({ _id: commentid });

    const newReplies = await Replies.create({
      post_id: mongoose.Types.ObjectId(relatedComment.post_id),
      comment_id: mongoose.Types.ObjectId(commentid),
      content: content_form,
      author_id: [req.userloggedIn.id],
      author_username: [req.userloggedIn.username]
    });

    res.status(201);
    res.json({ status: 'ok', message: 'Reply created', data: newReplies });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

router.put('/comments/reply/:replyId', auth, async (req, res) => {
  try {
    const { replyId } = req.params;
    const { content_form } = req.body;

    const relatedReply = await Replies.findOne({ _id: replyId }).lean();
    const replyAuthor = relatedReply.author_id?.toString() || '';

    if (replyAuthor == req.userloggedIn.id) {
      await Replies.updateOne(
        { _id: mongoose.Types.ObjectId(replyId) },
        { content: content_form }
      );
      return res.json({ status: 'ok', message: 'Reply Edited', author: true });
    }

    res.status(403);
    res.json({
      status: 'error',
      message: 'You are not author of reply',
      author: false
    });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

router.delete('/comments/reply/:replyId', auth, async (req, res) => {
  try {
    const { replyId } = req.params;
    const relatedReply = await Replies.findOne({ _id: replyId }).lean();
    const replyAuthor = relatedReply.author_id?.toString() || '';

    if (replyAuthor == req.userloggedIn.id) {
      await Replies.deleteOne({ _id: mongoose.Types.ObjectId(replyId) });
      return res.json({ status: 'ok', message: 'Reply Deleted', author: true });
    }

    res.status(403);
    res.json({
      status: 'ok',
      message: 'You are not author of reply',
      author: false
    });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

router.get('/topics', async (req, res) => {
  try {
    const dataTopics = await Topics.find({});
    res.json({ status: 'ok', data: dataTopics });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

router.post('/topics/create', async (req, res) => {
  try {
    const { topicName } = req.body;

    // Check if the topic with the same name already exists
    const existingTopic = await Topics.findOne({ topicName });

    if (existingTopic) {
      res.status(409).json({
        status: 'error',
        message: 'Topic already exists',
        data: existingTopic
      });
    } else {
      // Create the topic if it doesn't exist
      const newTopic = await Topics.create({
        topicId: mongoose.Types.ObjectId(),
        topicName: topicName
      });
      res.status(201).json({
        status: 'ok',
        message: 'New topic created',
        data: newTopic
      });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error });
  }
});

router.delete('/topics/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Topics.deleteOne({ topicId: id });
    res.json({ status: 'ok', message: 'topic deleted' });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

router.get('/admin/users', async (req, res) => {
  try {
    const userData = await User.find({});
    res.json({ status: 'ok', data: userData });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

// get user by id
router.get('/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userData = await User.findOne({ _id: id });
    res.json({ status: 'ok', message: 'user found', data: userData });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

router.delete('/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await User.deleteOne({ _id: id });
    res.json({ status: 'ok', message: 'user deleted' });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

router.get('/admin/runding', async (req, res) => {
  try {
    const dataRunding = await Runding.find({});
    res.json({ status: 'ok', data: dataRunding });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

// delete runding by id admin
router.delete('/admin/runding/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Runding.deleteOne({ _id: id });
    res.json({ status: 'ok', message: 'runding deleted' });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

// get all user by id inside runding peserta
router.get('/admin/runding/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dataRunding = await Runding.findOne({ _id: id });
    const dataPeserta = await User.find({ _id: dataRunding.peserta });
    res.json({ status: 'ok', data: dataPeserta });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

// remove user from runding peserta
router.delete('/admin/runding/:id/:userid', async (req, res) => {
  try {
    const { id, userid } = req.params;
    await Runding.updateOne(
      { _id: mongoose.Types.ObjectId(id) },
      {
        $pull: { peserta: userid }
      }
    );
    await User.updateOne(
      { _id: mongoose.Types.ObjectId(userid) },
      {
        $pull: { peserta: id }
      }
    );
    res.json({ status: 'ok', message: 'user deleted from runding' });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

// join user to runding peserta
router.put('/admin/join/:roomId/:userId', async (req, res) => {
  try {
    const { roomId, userId } = req.params;
    await Runding.updateOne(
      { _id: mongoose.Types.ObjectId(roomId) },
      {
        $push: { peserta: userId }
      }
    );
    await User.updateOne(
      { _id: mongoose.Types.ObjectId(userId) },
      {
        $push: { peserta: roomId }
      }
    );
    res.json({ status: 'ok', message: 'user join to runding' });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

router.put('/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, role } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    await User.updateOne(
      { _id: mongoose.Types.ObjectId(id) },
      {
        username: username,
        email: email,
        password: hashedPassword,
        role: role
      }
    );
    res.json({ status: 'ok', message: 'user updated' });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

// solved
router.put('/posts/solved/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { solved } = req.body;
    await Posts.updateOne(
      { _id: mongoose.Types.ObjectId(id) },
      {
        solved: solved
      }
    );
    res.json({ status: 'ok', message: 'post updated' });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

// topics request
router.get('/topics/request', async (req, res) => {
  try {
    const dataTopics = await TopicRequest.find({});
    res.json({ status: 'ok', data: dataTopics });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

router.post('/topics/request', async (req, res) => {
  try {
    const { topicName } = req.body;
    console.log(req.body);

    // Check if the topic with the same name already exists
    const existingTopic = await TopicRequest.findOne({ topicName });

    if (existingTopic) {
      res.status(409).json({
        status: 'error',
        message: 'Topic already exists',
        data: existingTopic
      });
    } else {
      // Create the topic if it doesn't exist
      const newTopic = await TopicRequest.create({
        topicId: mongoose.Types.ObjectId(),
        topicName: topicName
      });
      res.status(201).json({
        status: 'ok',
        message: 'New topic created',
        data: newTopic
      });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error });
  }
});

router.delete('/topics/request/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await TopicRequest.deleteOne({ _id: id });
    res.json({ status: 'ok', message: 'user deleted from runding' });
  } catch (error) {
    res.status(500);
    res.json({ status: 'error', message: error });
  }
});

module.exports = router;
