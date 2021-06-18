import * as express from "express";
import * as socketIO from "socket.io";
import * as http from "http";

const app = express.default();
const server = http.createServer(app);
const io = new socketIO.Server(server);

app.get("/", (req: express.Request, res: express.Response) => {
    res.status(200).json({
        message: "Socket Server for Digi-Dungeon, please use the a client to connect to the server",
        status: "Online"
    });
});

app.get("/cdn", (req: express.Request, res: express.Response) => {
    res.status(404).json({
        message: "CDN not yet implemented",
        status: "Offline"
    })
});

app.post("/register", (req: express.Request, res: express.Response) => {
    
});

app.post("/login", (req: express.Request, res: express.Response) => {
    
});

app.post("/logout", (req: express.Request, res: express.Response) => {
    
});

io.on("connection", (socket: socketIO.Socket) => {
    console.log(socket.id);

    socket.on("handshake", (data: any) => {

    });
});

app.listen(8080, () => {
    console.log("Listening on port:", 3000);
});