const request = require("supertest");
const mongoose = require("mongoose");

const Qoutation = require("../../../../models/Qoutation");
const QouteCategory = require("../../../../models/QouteCategory");

const {
  generateUserSession,
  cleanUserSession,
} = require("../../test_helpers/userSessionHelper");
const { ADMIN } = require("../../../../enums/roles");

let server;
describe("/api/qoutations/", () => {
  beforeEach(() => {
    server = require("../../../../index");
  });

  afterEach(async () => {
    server.close();
    await Qoutation.deleteMany({});
    await QouteCategory.deleteMany({});
  });

  describe("GET /api/qoutations/random_qoutation/:id", () => {
    const route = "/api/qoutations/random_qoutation/";
    it("should return 404 status response if no qoutation is found", async () => {
      const result = await request(server).get(
        route + mongoose.Types.ObjectId().toHexString()
      );

      expect(result.status).toBe(404);
      expect(result.body.error).not.toBeNull();
    });

    it("should return 200 status response with a random qoutation", async () => {
      const category = await new QouteCategory({
        name: "test",
        isFree: true,
      }).save();
      const qoute = await new Qoutation({
        qoutation: "this is a test qoutation",
        category,
      }).save();

      const categoryId = category._id.toHexString();
      const result = await request(server).get(route + categoryId);

      expect(result.status).toBe(200);
      expect(result.body.qoutation).toBe(qoute.qoutation);
      expect(result.body._id).toBe(qoute._id.toHexString());
    });
  });

  describe("GET /api/qoutations/:id", () => {
    const route = "/api/qoutations/";

    it("should return 404 response and error body if qoutation of given id is not available", async () => {
      const result = await request(server).get(
        route + mongoose.Types.ObjectId().toHexString()
      );
      expect(result.status).toBe(404);
      expect(result.body.error).not.toBeNull();
    });

    it("should return 200 response and qoutation of given id", async () => {
      const category = await new QouteCategory({
        name: "test",
        isFree: true,
      }).save();
      const qoute = await new Qoutation({
        qoutation: "this is a test qoutation",
        category,
      }).save();

      const result = await request(server).get(route + qoute._id.toHexString());
      expect(result.status).toBe(200);

      expect(result.body._id).toEqual(qoute._id.toHexString());
    });
  });

  describe("GET /api/qoutations", () => {
    const route = "/api/qoutations/";

    it("should return 200 response and qoute categories array", async () => {
      const category = await new QouteCategory({
        name: "test",
        isFree: true,
      }).save();

      const qoute = await new Qoutation({
        qoutation: "category",
        category,
      }).save();

      const result = await request(server).get(route);
      expect(result.status).toBe(200);

      expect(
        result.body.some((cat) => cat._id === qoute._id.toHexString())
      ).toBeTruthy();
    });
  });

  describe("POST /api/qoutations", () => {
    const route = "/api/qoutations/";

    let authToken = "";

    beforeEach(async () => {
      const { token } = await generateUserSession(ADMIN);
      authToken = token;
    });

    afterEach(cleanUserSession);

    it("should return 400 response with error if request body is not valid", async () => {
      const body = {};
      const result = await request(server)
        .post(route)
        .set("x-auth-token", authToken)
        .send(body);

      expect(result.status).toBe(400);
      expect(result.body.error).not.toBeNull();
    });

    it("should return response with 200 status code and qoutation", async () => {
      const category = await new QouteCategory({
        name: "test",
        isFree: true,
      }).save();

      const body = {
        qoutation: "this is a test qoutation",
        category: category._id,
      };
      const result = await request(server)
        .post(route)
        .set("x-auth-token", authToken)
        .send(body);

      expect(result.status).toBe(200);
      expect(result.body.qoutation).toBe(body.qoutation);
    });

    it("should create a new new qoutation.", async () => {
      const category = await new QouteCategory({
        name: "test",
        isFree: true,
      }).save();
      const body = {
        qoutation: "this is a test qoutation",
        category: category._id,
      };
      const result = await request(server)
        .post(route)
        .set("x-auth-token", authToken)
        .send(body);
      const qoute = await Qoutation.findOne({
        qoutation: body.qoutation,
        "category._id": category._id,
      });
      expect(qoute._id.toHexString()).toEqual(result.body._id);
    });
  });

  describe("PUT /api/qoutations/:id", () => {
    const route = "/api/qoutations/";

    let authToken = "";

    beforeEach(async () => {
      const { token } = await generateUserSession(ADMIN);
      authToken = token;
    });

    afterEach(cleanUserSession);

    it("should return 400 response with error if request body is not valid", async () => {
      const body = {};
      const result = await request(server)
        .put(route + mongoose.Types.ObjectId().toHexString())
        .set("x-auth-token", authToken)
        .send(body);

      expect(result.status).toBe(400);
      expect(result.body.error).not.toBeNull();
    });

    it("should return 404 response and error body if qoutation of given id is not available", async () => {
      const category = await new QouteCategory({
        name: "test",
        isFree: true,
      }).save();
      const body = {
        qoutation: "this is a test qoutation",
        category: category._id,
      };
      const result = await request(server)
        .put(route + mongoose.Types.ObjectId().toHexString())
        .set("x-auth-token", authToken)
        .send(body);

      expect(result.status).toBe(404);
      expect(result.body.error).not.toBeNull();
    });

    it("should update the qoutation of given id", async () => {
      const category = await new QouteCategory({
        name: "test",
        isFree: true,
      }).save();

      const qoute = await new Qoutation({
        qoutation: "this is a test qoutation",
        category: category._id,
      }).save();

      const newCategory = await new QouteCategory({
        name: "test",
        isFree: true,
      }).save();

      const body = {
        qoutation: "updated qoutation",
        category: newCategory._id,
      };

      await request(server)
        .put(route + qoute._id.toHexString())
        .set("x-auth-token", authToken)
        .send(body);

      const updatedCategory = await Qoutation.findById(qoute._id);
      expect(updatedCategory.qoutation).toBe(body.qoutation);
      expect(updatedCategory.category._id.toHexString()).toBe(
        newCategory._id.toHexString()
      );
      expect(qoute._id.toHexString()).toEqual(
        updatedCategory._id.toHexString()
      );
    });

    it("should return 200 status code with updated qoutation", async () => {
      const category = await new QouteCategory({
        name: "test",
        isFree: true,
      }).save();
      const qoute = await new Qoutation({
        qoutation: "this is a test qoutation",
        category,
      }).save();

      const updateData = {
        qoutation: "updated qoutation",
        category: category._id,
      };

      const result = await request(server)
        .put(route + qoute._id.toHexString())
        .set("x-auth-token", authToken)
        .send(updateData);

      expect(result.body.qoutation).toBe(updateData.qoutation);
      expect(result.body._id).toEqual(qoute._id.toHexString());
    });
  });

  describe("DELETE /api/qoutations/:id", () => {
    const route = "/api/qoutations/";

    let authToken = "";

    beforeEach(async () => {
      const { token } = await generateUserSession(ADMIN);
      authToken = token;
    });

    afterEach(cleanUserSession);

    it("should return 200 status code with deleted qoute", async () => {
      const category = await new QouteCategory({
        name: "test",
        isFree: true,
      }).save();

      const qoute = await new Qoutation({
        qoutation: "this is a test qoutation",
        category,
      }).save();

      const result = await request(server)
        .delete(route + qoute._id.toHexString())
        .set("x-auth-token", authToken);

      expect(result.status).toBe(200);
      expect(result.body._id).toEqual(qoute._id.toHexString());
    });

    it("should deleted the qoute of the given id", async () => {
      const category = await new QouteCategory({
        name: "test",
        isFree: true,
      }).save();
      const qoute = await new Qoutation({
        qoutation: "this is a test qoutation",
        category,
      }).save();

      await request(server)
        .delete(route + qoute._id.toHexString())
        .set("x-auth-token", authToken);

      const deleted = await Qoutation.findById(qoute._id);
      expect(deleted).toBeNull();
    });
  });
});
