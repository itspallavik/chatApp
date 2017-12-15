var express = require('express');	
var app = express();
var server = require('http').createServer(app);  
var io = require('socket.io').listen(server);
users =[];
connections=[];
server.listen(process.env.PORT || 3001);
console.log('server running...');

var mysql = require('mysql');

// const port=3001;

// app.listen(port,function(){
//     console.log("Server running on localhost:"+port);
// });

var db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "bitware123",
    database: "db_dev_chat"
  });


  db.connect(function(err) {
    if (err) throw err;
    console.log("Connected!!!");
  });

app.get('/',function(req,res){
	res.sendFile(__dirname + '/index.html');
});

io.sockets.on('connection',function(socket){ 
	connections.push(socket); 
	
	console.log('connected: %s sockets connected',connections.lenght);
	// disconnect socket 
	socket.on('disconnect',function(data){
		connections.splice(connections.indexOf(socket),1);
		console.log('Disconnected: %s sockets Disconnected',connections.lenght);
	});
	// send message
	// socket.on('send message',function(data){
	// 	console.log('username'+socket.username);
	// 	io.sockets.emit('new message',{msg:data,users:socket.username})
	// });

	  // socket.on('private message', function (from, msg) {
	  //   console.log('I received a private message by ', from, ' saying ', msg);
	  // });

	socket.on('eventToClient',function(data) {
    // do something with data
       var msg = data.msg        
       var name = data.to_user
       var from_user = socket.username
       var group_id = data.group_id
       var logged_user = socket.username

       //console.log('event to client from_user-->'+from_user);
       //console.log('event to client name-->'+name);

       var post  = {
		  to_user: name,
		  from_user: from_user,
		  txt_message: msg,
		  grp_id: group_id
		};
	   db.query('INSERT INTO messages SET ?', post);

	       
	        	io.sockets.emit('new message',{msg:msg,users:socket.username,to:name,logged_user:logged_user})
	  

	   

       
 	});

 	 



 	// fetch older history

 	socket.on('getHistory',function(data) {
       var to_user1 = data.to_user1        
       var from_user1 = data.from_user1
       var group_id  = data.group_id

       if(group_id==''){
       		var queryString = "SELECT * FROM messages WHERE (to_user= ? AND from_user= ?)OR(to_user= ? AND from_user= ?) ORDER BY time ASC;"
	   		var filter = [to_user1, from_user1,from_user1,to_user1];
       }else{
       		var queryString = "SELECT * FROM messages WHERE grp_id= ? ORDER BY time ASC;"
	   		var filter = [group_id];
       }

		db.query(queryString, filter, function(err, results) {
			  // console.log('server get history'+JSON.stringify(results));
		   io.sockets.emit('older message',JSON.stringify(results));
		});

	  //   db.query("select * from messages where (to_user='Raj' AND from_user='wasim')OR(to_user='wasim' AND from_user='Raj') ", function (err, result, fields) {
		 //    console.log('server get history'+result);
		 //    //console.log('pallla->'+result.name);
		 //    io.sockets.emit('older message',JSON.stringify(result));
		 // }); 
 	});

	//new users
	socket.on('new user',function(data,callback){
		callback(true);
		socket.username = data;
		users.push(socket.username);
		db.query('INSERT INTO users (name) VALUES (?)',socket.username);
		updateUsernames();
		updateGroups();
	});

	function updateGroups(){
		db.query("SELECT `group_name`,`group_id` FROM `group`", function (err, result, fields) {
		    console.log('group updated');
		    //console.log('get groups->'+result);
		    if(err){
		    	console.log('Error---->'+err);
		    }else{
		    	io.sockets.emit('get groups',JSON.stringify(result));
		    }
		    
		 });
	}

	function updateUsernames() {
		db.query("SELECT name FROM users", function (err, result, fields) {
		    console.log('users updated');
		    //console.log('pallla->'+result.name);
		    io.sockets.emit('get users',JSON.stringify(result));
		 });
	}

	
});
