const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const app = express();
const users = require('./services/users');
const port = (process.env.PORT || 80);

const Ajv = require('ajv');
const ajv = new Ajv({strict: false});
const postInfoschema = require('./schema/verkko.schema.json');
const postInfoValidator = ajv.compile(postInfoschema);


const postValidateMW = function(req, res, next) {
	const tulos = postInfoValidator(req.body);
	if(tulos == true) {
		next();
	}else {
		res.sendStatus(400);
	}
}

const posts = [];



const esimerkki = [
{
    "id": "", //leave this empty
    "title": "Myydään sohva",
    "desc": "Kaunis sohva",
    "category": "Huonekalut",
    "location": "Oulu",
    "images": "base64 encoded image",
    "price": "50,99",
    "post_date": "20.7.2021",
    "delivery": ["pickup", "shipping"],
    "seller_name": {
        "fname": "Jarkko",
        "lname": "Salminen",
        "phone_num": "0405959593"
    }

}
];
		

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));


app.get('/', (req, res) => res.sendFile(path.join(__dirname+'/api.html')));






const passport = require('passport');
const BasicStrategy = require('passport-http').BasicStrategy;

passport.use(new BasicStrategy(
  function(username, password, done) {

    const user = users.getUserByName(username);
    if(user == undefined) {

      console.log("HTTP Basic username not found");
      return done(null, false, { message: "HTTP Basic username not found" });
    }


    if(bcrypt.compareSync(password, user.password) == false) {

      console.log("HTTP Basic password not matching username");
      return done(null, false, { message: "HTTP Basic password not found" });
    }
    return done(null, user);
  }
));

app.get('/httpBasicProtectedResource',
        passport.authenticate('basic', { session: false }),
        (req, res) => {
  res.json({
    yourProtectedResource: "profit"
  });
});


app.post('/registerBasic',
        (req, res) => {

  if('username' in req.body == false ) {
    res.status(400);
    res.json({status: "Missing username from body"})
    return;
  }
  if('password' in req.body == false ) {
    res.status(400);
    res.json({status: "Missing password from body"})
    return;
  }
  if('email' in req.body == false ) {
    res.status(400);
    res.json({status: "Missing email from body"})
    return;
  }

  const salt = bcrypt.genSaltSync(6);
  const hashedPassword = bcrypt.hashSync(req.body.password, salt);
  console.log(hashedPassword);
  users.addUser(req.body.username, req.body.email, hashedPassword);

  res.status(201).json({ status: "created" });
});





app.get('/posts', (req, res) => {
	res.json(posts);
})


app.post('/newPost', postValidateMW,passport.authenticate('basic', { session: false }),  (req,res) => {
	posts.push({
    username: req.user.username,
    id: uuidv4(),
    title: req.body.title,
    desc: req.body.desc,
    category: req.body.category,
    loc: req.body.loc,
    images: req.body.images,
    price: req.body.price,
    post_date: req.body.post_date,
    delivery: req.body.delivery,
    seller_name: req.body.seller_name

});
	res.sendStatus(201);


})

app.put('/posts/:id',postValidateMW,passport.authenticate('basic', {session: false}), (req, res) => {

	const posti = posts.findIndex(p => p.id === (req.params.id));
	console.log(posts[posti].username)
	console.log(req.user.username)

	if(req.user.username == posts[posti].username)
	{	
	console.log(posti);
	if(posti == -1) {
		res.sendStatus(404);
	}
	else {
	posts[posti] = {
    username: req.user.username,
    id: req.params.id,
    title: req.body.title,
    desc: req.body.desc,
    category: req.body.category,
    loc: req.body.loc,
    images: req.body.images,
    price: req.body.price,
    post_date: req.body.post_date,
    delivery: req.body.delivery,
    seller_name: req.body.seller_name

}
res.sendStatus(200);	} 
}

else {
	res.sendStatus(401);
}
		
})

app.delete('/posts/:id',passport.authenticate('basic', {session: false}), (req, res) => {

	const posti = posts.findIndex(p => p.id === (req.params.id));
	console.log(posts[posti].username)
	console.log(req.user.username)

	if(req.user.username == posts[posti].username)
	{	
	console.log(posti);
	if(posti == -1) {
		res.sendStatus(404);
	}
	else {
	 posts.splice([posti],1)
	res.sendStatus(200);	
	} 
}

else {
	res.sendStatus(401);
}
		
})

app.get('/searchbyCategory/:cat', (req, res) => {
	const category = [];
	
	for (var x = 0; x < posts.length; x++) 
	{
		if(posts[x].category == req.params.cat)
		{
		category.push(posts[x])
		}
	}


	res.send(category);
})

app.get('/searchbyLocation/:loc', (req, res) => {
	const category = [];
	
	for (var x = 0; x < posts.length; x++) 
	{
		if(posts[x].loc == req.params.loc)
		{
		category.push(posts[x])
		}
	}


	res.send(category);
})

app.get('/searchbyDate/:date', (req, res) => {
	const category = [];
	
	for (var x = 0; x < posts.length; x++) 
	{
		if(posts[x].post_date == req.params.date)
		{
		category.push(posts[x])
		}
	}


	res.send(category);
})


app.listen(port, () => console.log(`Example app listening on port ${port}!`))
