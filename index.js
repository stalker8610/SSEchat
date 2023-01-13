import express from 'express'
import path from 'node:path'
import { EventEmitter } from 'node:events'

const __dirname = path.resolve();

function* generateId(session){
	let id=1;
	while(true) yield id++;
}


var app = express();
app.use(express.static(path.join(__dirname, 'client/')));
app.use(express.json());
app.use(express.urlencoded());

const port = 8080;

let emitter = new EventEmitter();

app.get('/', (req, res)=>{
	res.sendFile(path.join(__dirname, 'client/index.html'));
});

app.get('/connect', async (req, res)=>{

	const idGenerator = generateId();
	res.set({'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive'
	});
	res.flushHeaders();
	res.write('retry: 10000\n\n');

	const userName = req.query.userName;
	emitter.on('newConnect', (userName)=>{ 
		const messageId = idGenerator.next().value;
		res.write(`data: user ${userName} connected! #${messageId}\nid: ${messageId}\n\n`);
	});

	emitter.on('newMessage', (userName, message)=>{
		const messageId = idGenerator.next().value;
		res.write(`data: ${userName}: ${message} #${messageId}\nid: ${messageId}\n\n`);
	});

	emitter.emit('newConnect', userName);
});


app.post('/postMessage', (req, res)=>{
	const userName = req.body.userName;
	const message = req.body.message;
	emitter.emit('newMessage', userName, message);
});


app.listen(port, ()=>{ console.log(`Server started on port ${port}`) });
