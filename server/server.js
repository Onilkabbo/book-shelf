const express          = require('express');
const cookieParser     = require('cookie-parser');
const mongoose         = require('mongoose');
const config           = require('./config/config').get(process.env.NODE_ENV);
const app              = express();
const port             = process.env.PORT || 3001;

const { User }         = require('./models/user');
const { Book }         = require('./models/book');
const { auth }         = require('./middleware/auth');

mongoose.Promise = global.Promise;
mongoose.connect(config.DATABASE, {useNewUrlParser: true, useCreateIndex: true})
        .then(()=> console.log('Database is connected'))
        .catch(err => console.log(err));

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

// GET //
app.get('/api/auth', auth, (req, res) => {
    res.json({
        isAuth: true,
        name: req.user.name,
        id:req.user._id,
        email: req.user.email,
        lastname: req.user.lastname
    })
})
app.get('/api/getbook', (req, res) => {
    //licalhost:3001/api/getbook?id=_id
    let id = req.query.id;
    Book.findById(id, (err, doc) => {
        if(err) return res.status(400).send(err);
        res.send(doc);
    });
});

app.get('/api/books', (req, res) => {
    //licalhost:3001/api/books?skip=3&limit=2&order=asc
    let skip = parseInt(req.query.skip);
    let limit = parseInt(req.query.limit);
    let order = req.query.order;

    Book.find().skip(skip).sort({_id:order}).limit(limit).exec((err, docs) => {
        if(err) return res.status(400).send(err);
        res.send(docs);
    })
})

// POST //
app.post('/api/book', (req, res) => {
    const book = new Book(req.body);
    console.log(req.body)
    book.save((err, doc) => {
        if(err) return console.log('ssss',err);
        res.status(200).json({
            post: true,
            bookId: doc._id
        });
    })
});

app.get('/api/get-reviewer', (req, res) => {
    let id= req.query.id;
    User.findById(id, (err, doc) => {
        if(err) return res.status(400).send(err);
        res.json({
            name: doc.name,
            lastname: doc.lastname
        })
    });
});

app.post('/api/register', (req, res) => {
    const user = new User(req.body);
    user.save((err, doc) => {
        if(err) return res.json({success: false})
        res.status(200).json({
            success: true,
            user: doc
        });
    })
});

app.get('/api/users', (req, res) => {
    User.find({}, (err, users) => {
        if(err) return console.log(err);
        res.send(users);
    })
});

app.get('/api/user_posts', (req, res) => {
    Book.find({ownerId: req.query.user}).exec((err, docs) => {
        if(err) return console.log(err);
        res.send(docs);
    })
});

app.get('/api/logout', auth, (req, res) => {
    req.user.deleteToken(req.token, (err, user) => {
        if(err) return res.send(err);
        res.sendStatus(200);
    });
});

app.post('/api/login', (req, res) => {
    User.findOne({email: req.body.email}, (err, user) => {
        if(!user) return res.send({isAuth: false, message: 'Email not found'});
        user.comparePassword(req.body.password, (err, isMatch) => {
            if(!isMatch) return res.json({
                isAuth: false,
                message: 'Wrong password'
            });
            user.generateToken((err, user) => {
                if(err) return res.send(err);
                res.cookie('auth', user.token).json({
                    isAuth: true,
                    id: user._id,
                    email: user.email
                });
            })
        })
    })
})



// UPDATE //
app.post('/api/book-update', (req, res) => {
    Book.findOneAndUpdate(req.body.id, req.body, {new : true}, (err, doc) => {
        if(err) return console.log(err);
        res.send({
            success: true,
            doc
        });
    })
})

// DELETE //
app.delete('/api/delete-book', (req, res) => {
    let id = req.query.id;
    Book.findByIdAndRemove(id, (err, doc) => {
        if(err) return res.status(400).send(err);
        res.send({
            success: true
        });
    })
})


app.listen(port, () => console.log(`Server is running on port: ${port}`));
