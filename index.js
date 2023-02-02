const express = require('express')
const mysql = require('mysql2')
const multer = require('multer')
const bodyParser = require('body-parser') 
const app = express()
const fs = require('fs')
const path = require('path')
const ejs = require('ejs')
const session = require('express-session')
const crypto = require('crypto')

app.use(session ({
    secret: crypto.randomBytes(64).toString('hex'),
    resave : false,
    saveUninitialized : false
}))



app.use(bodyParser.urlencoded({ extended: true}))
app.use(express.static(path.join(__dirname, 'public')))
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

const connection = mysql.createPool({
    host: "127.0.0.1",
    user: "root",
    password: "new_password",
    database: "KALI_Schema",
    connectionLimit: 10
})
app.get('/update2', (req, res)=> {
    res.render('updatephoto2.ejs')
})

app.get('/', (req, res) => {
    res.render('signup.ejs')
})
app.get('/login', (req, res) => {
    res.render('login.ejs')
})
app.get('/update', (req, res) => {
    res.render('update.ejs')
})
app.get('/delete', (req, res) => {
   const data = req.session.email
   connection.getConnection((error, connection) => {
    if(error){
        res.send("Error connecting to the database")
    }
    const query = `UPDATE MemberInfo SET image = NULL WHERE email = ?`
    connection.query(query, [data], (err, result) => {
        if(err) {
            res.send("Error in removing  your image")
        } 
        const query2 = `SELECT username, info, email FROM MemberInfo WHERE email = ?`
        connection.query(query2, [data], (err, result) => {
            if(err) throw err;
            const user = result[0]
            res.render('delete.ejs', { user : user})
        })
    })
   })
})


const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadPath = path.join(__dirname, 'public/uploads/');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now());
  }
});

const upload =  multer({ storage : storage})

app.post('/signup', upload.single('image'), (req, res) => {
    connection.getConnection((error, connection) => {
        if (error) {
            return res.status(500).json({ error: "Error connecting to the database"})
        }
        
        const uname = req.body.uname
        const email= req.body.email
        const password = req.body.password
        const cpass = req.body.cpass
        const info = req.body.message
        const gender = req.body.gender
        const image = fs.readFileSync(req.file.path)
        const query = `INSERT INTO MemberInfo (username, email, password ,cpassword, image,info, gender) VALUES (?,?,?,?,?,?,?)`
        connection.query(query, [uname, email, password, cpass, image, info, gender], (error, result) => {
            connection.release()
            if (error) throw error;
            fs.unlinkSync(req.file.path)
            res.redirect('/login')
        })
    })
})


app.get('/profile', (req, res) => {
    req.session.email =  req.query.email
    console.log("User data stored in the session")
    const email = req.query.email
    const password = req.query.password
    
    connection.getConnection((error, connection) => {
        if (error) {
            return res.status(500).json({ error: "Error connecting to the database"})
        }
        const query = `SELECT * FROM MemberInfo WHERE email = ? AND password = ?`
        connection.query(query, [email, password], (error, result) => {
            connection.release()
            if(error){
                return res.status(500).send({ error: "Error retrieving the data from the database"})
            }
            const user = result[0]
            if(user){
                const base64Image = Buffer.from(user.image, 'binary').toString('base64');
                res.render('profile.ejs', { user: user, image: base64Image});
            } else {
                res.send('Incorrect username or password')
            }
        })
    })
})


const update = multer({ dest : 'uploads/'})
app.post('/update',update.single('image'),(req, res) => {
    const data = req.session.email
    console.log(data)
    const username = req.body.uname
    const password = req.body.password
    const message = req.body.message
    let image;
    if(req.file && req.file.path){
        image = fs.readFileSync(req.file.path)
    }else {
        res.send('No file was uploaded')
    }
    connection.getConnection((error, connection) => {
        if (error) {
            res.send("Error connecting to the database")
        }
        const query = `UPDATE MemberInfo SET username = ? , password = ? , info = ? , image = ? WHERE email = ? `
        connection.query(query, [username, password, message, image, data], (error, result) => {
            if(error) {
                res.send("Error in updating your information")
            }
            fs.unlinkSync(req.file.path)
          const query1 = `SELECT * FROM MemberInfo WHERE email = ?`
          connection.query(query1, [data], (err, result) => {
            if(err) {
                res.send("Error in updating your information")
            }
            const user = result[0]
            if(user){
                const base64Image = Buffer.from(user.image, 'binary').toString('base64');
                res.render('profile.ejs', { user: user, image: base64Image});
            } else {
                res.send('Incorrect username or password')
            }
          })
        })
    })
})

app.post('/update2',update.single('image'),(req, res) => {
    const data = req.session.email
    const image = fs.readFileSync(req.file.path)
    connection.getConnection((error, connection) => {
        if(error){
            res.send("Error connecting to the database")
        }
        const query =  `UPDATE MemberInfo SET image = ? WHERE email = ?`
        connection.query(query, [image, data], (err, result)=> {
            if(err){
                res.send("Error retrieving the data from the database")
            }
            const query3 = `SELECT * FROM MemberInfo WHERE email = ?`
            connection.query(query3, [data], (err, result) => {
                if (err) throw err;
                fs.unlinkSync(req.file.path)
                const user = result[0]
                const base64Image = Buffer.from(user.image, 'binary').toString('base64');
                res.render('profile.ejs', { user: user, image: base64Image});
                
            })
        })
    })
})


app.listen(3000)


