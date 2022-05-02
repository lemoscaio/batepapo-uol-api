import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import Joi from "joi";
import dotenv from "dotenv";
import dayjs from "dayjs";
import { strict as assert } from "assert";
import { stripHtml } from "string-strip-html";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// CONNECTING MONGODB
const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect().then(() => {
    db = mongoClient.db(process.env.DATABASE);
});

// SCHEMAS
const newParticipantSchema = Joi.object({
    name: Joi.string().required(),
});

const newMessageSchema = Joi.object({
    from: Joi.string().required(),
    to: Joi.string().required(),
    text: Joi.string().required(),
    type: Joi.string().pattern(/^(private_message|message)$/),
    time: Joi.any(),
    _time: Joi.any(),
});

// STARTING SERVER

app.listen(process.env.PORT, () => {
    console.log("Server running on port", process.env.PORT);
});

// PARTICIPANTS ROUTE

app.get("/participants", async (req, res) => {
    try {
        const users = await db.collection("users").find().toArray();
        res.send(users);
    } catch (error) {
        res.sendStatus(500);
    }
});

app.post("/participants", async (req, res) => {
    const newParticipant = cleanHTML(req.body);

    try {
        await newParticipantSchema.validateAsync(newParticipant, {
            abortEarly: false,
        });
    } catch (error) {
        res.status(422).send(error.details.map((err) => err.message));
        return;
    }

    const user = await db
        .collection("users")
        .findOne({ name: newParticipant.name });

    if (user) {
        res.sendStatus(409);
        return;
    }

    if (!newParticipant.name) {
        res.sendStatus(400);
    }

    const registerUserMessage = {
        from: newParticipant.name,
        to: "Todos",
        text: "entra na sala...",
        type: "status",
        time: dayjs().format("HH:mm:ss"),
        _time: Date.now(),
    };

    try {
        await db.collection("users").insertOne({
            ...newParticipant,
            lastStatus: Date.now(),
        });

        await db.collection("messages").insertOne({
            ...registerUserMessage,
        });

        res.sendStatus(201);
    } catch (error) {
        res.sendStatus(500);
    }
});

// MESSAGES ROUTE

app.get("/messages", async (req, res) => {
    const limit = parseInt(cleanHTML(req.query.limit));
    const { user } = cleanHTML(req.headers);

    let messages = [];
    try {
        if (limit) {
            messages = await db
                .collection("messages")
                .find({}, { limit, sort: { _time: -1 } })
                .toArray();
        } else {
            messages = await db.collection("messages").find().toArray();
        }

        const filteredMessages = messages.filter((message) => {
            if (
                message.type === "private_message" &&
                (message.to === user || message.from === user)
            )
                return true;
            else if (message.type === "private_message") return false;
            else return true;
        });

        if (limit) {
            res.send([...filteredMessages].reverse());
            return;
        } else {
            res.send(filteredMessages);
            return;
        }
    } catch (error) {
        res.sendStatus(500);
    }
});

app.post("/messages", async (req, res) => {
    const { user } = cleanHTML(req.headers);

    const userExists = await db.collection("users").findOne({ name: user });

    if (!userExists) {
        res.sendStatus(422);
        return;
    }

    const newMessage = {
        ...cleanHTML(req.body),
        from: user,
        time: dayjs().format("HH:mm:ss"),
        _time: Date.now(),
    };

    try {
        await newMessageSchema.validateAsync(newMessage, {
            abortEarly: false,
        });
    } catch (error) {
        res.status(422).send(error.details.map((err) => err.message));
        return;
    }

    try {
        await db.collection("messages").insertOne({ ...newMessage });
        res.sendStatus(201);
    } catch (error) {
        res.sendStatus(500);
    }
});

app.delete("/messages/:messageId", async (req, res) => {
    const { messageId } = cleanHTML(req.params);
    const { user } = cleanHTML(req.headers);

    let message;
    try {
        message = await db
            .collection("messages")
            .findOne({ _id: new ObjectId(messageId) });
    } catch (err) {
        res.sendStatus(404);
        return;
    }

    if (message.from !== user) {
        res.sendStatus(401);
        return;
    }

    try {
        const deletedMessage = await db
            .collection("messages")
            .deleteOne({ _id: new ObjectId(messageId) });

        if (deletedMessage.deletedCount === 1) {
            res.sendStatus(200);
            return;
        } else {
            res.sendStatus(404);
            return;
        }
    } catch (err) {
        res.sendStatus(500);
    }
});

app.put("/messages/:messageId", async (req, res) => {
    const { messageId } = cleanHTML(req.params);
    const { user } = cleanHTML(req.headers);

    const userExists = await db.collection("users").findOne({ name: user });

    if (!userExists) {
        res.sendStatus(422);
        return;
    }

    const editedMessage = {
        ...cleanHTML(req.body),
        from: user,
    };

    try {
        await newMessageSchema.validateAsync(editedMessage, {
            abortEarly: false,
        });
    } catch (error) {
        res.status(422).send(error.details.map((err) => err.message));
        return;
    }

    try {
        const foundMessage = await db
            .collection("messages")
            .findOne({ _id: new ObjectId(messageId) });

        if (!foundMessage) {
            res.sendStatus(404);
            return;
        } else if (foundMessage.from !== user) {
            res.sendStatus(401);
            return;
        }

        try {
            const updateConfirmation = await db
                .collection("messages")
                .updateOne(
                    { _id: foundMessage._id },
                    { $set: { ...editedMessage } }
                );
            if (updateConfirmation.modifiedCount > 0) {
                res.sendStatus(202);
                return;
            } else {
                res.sendStatus(404);
                return;
            }
        } catch (error) {
            res.sendStatus(404);
            return;
        }
    } catch (error) {
        res.sendStatus(404);
        return;
    }
});

// STATUS ROUTE

app.post("/status", async (req, res) => {
    const { user } = cleanHTML(req.headers);

    const foundUser = await db.collection("users").findOne({ name: user });

    if (!foundUser) {
        res.sendStatus(404);
        return;
    }

    await db.collection("users").updateOne(
        {
            name: user,
        },
        { $set: { lastStatus: Date.now() } }
    );

    res.sendStatus(200);
});

// FUNCTIONS

(function checkActiveUsers() {
    setInterval(async () => {
        await db
            .collection("users")
            .find()
            .forEach(async (user) => {
                if (Date.now() - user.lastStatus >= 10000) {
                    const deletedUser = await db
                        .collection("users")
                        .deleteOne({ name: user.name });
                    if (deletedUser.deletedCount === 1) {
                        const deletedMessage = {
                            from: user.name,
                            to: "Todos",
                            text: "sai da sala...",
                            type: "status",
                            time: dayjs().format("HH:mm:ss"),
                            _time: Date.now(),
                        };

                        await db
                            .collection("messages")
                            .insertOne({ ...deletedMessage });
                    } else console.log("Não consegui deletar o usuário");
                }
            });
    }, 15000);
})();

function cleanHTML(variable) {
    if (typeof variable === "object") {
        for (let key in variable) {
            try {
                variable[key] = stripHtml(variable[key]).result.trim();
            } catch (err) {
                break;
            }
        }

        return variable;
    }

    if (typeof variable === "string") {
        return stripHtml(variable).result.trim();
    }
}
