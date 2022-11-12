const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.eexlwpm.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).send({ message: "unauthorized" });
  }
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(401).send({ message: "unauthorized" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const serviceCollection = client
      .db("artihcPhotography")
      .collection("services");

    const reviewCollection = client
      .db("artihcPhotography")
      .collection("reviews");

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    

    app.post("/services", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    });

    app.get("/serviceDetails/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const cursor = serviceCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });

    app.get("/reviews", async (req, res) => {
      const id = req.query.id;
      console.log(id);
      const query = { serviceId: id };
      const cursor = reviewCollection.find(query).sort({ timeStamp: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/myReviews", verifyJWT, async (req, res) => {
      const decoded = req.decoded;
      const email = req.query.email;
      if (decoded?.email !== email) {
        res.status(403).send({ message: "forbidden" });
      }
      const query = { email: email };
      const cursor = reviewCollection.find(query).sort({ timeStamp: -1 });
      const reviews = await cursor.toArray();
      res.send(reviews);
    });

    app.delete("/myReviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/editReview/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewCollection.findOne(query);
      res.send(result);
    });

    app.patch("/editReview/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const newMessage = req.body.editedReview;
      const newReview = {
        $set: {
          review: newMessage,
        },
      };
      const result = await reviewCollection.updateOne(query, newReview);
      res.send(result);
    });
  } finally {
  }
}
run().catch((error) => console.error(error));

app.get("/", (req, res) => {
  res.send("artihc-photography-server running");
});

app.listen(port, () => {
  console.log("artihc photography server runnning on 5000");
});
