const request = require("supertest");
const mongoose = require("mongoose");

const Ethnicity = require("../../../../models/Ethnicity");

const {
  generateUserSession,
  cleanUserSession,
} = require("../../test_helpers/userSessionHelper");
const { ADMIN } = require("../../../../enums/roles");

let server;
describe("/api/ethnicities/", () => {
  beforeEach(() => {
    server = require("../../../../index");
  });
  afterEach(async () => {
    server.close();
    await Ethnicity.deleteMany({});
  });

  describe("GET /api/ethnicities/:id", () => {
    const route = "/api/ethnicities/";

    it("should return 404 response and error body if ethnicity of given id is not available", async () => {
      const result = await request(server).get(
        route + mongoose.Types.ObjectId().toHexString()
      );
      expect(result.status).toBe(404);
      expect(result.body.error).not.toBeNull();
    });

    it("should return 200 response and ethnicity of given id", async () => {
      const ethnicity = await new Ethnicity({
        name: "ethnicity",
      }).save();

      const result = await request(server).get(
        route + ethnicity._id.toHexString()
      );
      expect(result.status).toBe(200);

      expect(result.body._id).toEqual(ethnicity._id.toHexString());
    });
  });

  describe("GET /api/ethnicities", () => {
    const route = "/api/ethnicities/";

    it("should return 200 response and goal categories array", async () => {
      const ethnicity = await new Ethnicity({
        name: "ethnicity",
      }).save();

      const result = await request(server).get(route);
      expect(result.status).toBe(200);

      expect(
        result.body.some((cat) => cat._id === ethnicity._id.toHexString())
      ).toBeTruthy();
    });
  });

  describe("POST /api/ethnicities", () => {
    const route = "/api/ethnicities/";

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

    it("should return response with 200 status code and ethnicity", async () => {
      const body = {
        name: "ethnicity",
      };
      const result = await request(server)
        .post(route)
        .set("x-auth-token", authToken)
        .send(body);

      expect(result.status).toBe(200);
      expect(result.body).toMatchObject(body);
    });

    it("should create a new new ethnicity.", async () => {
      const body = {
        name: "ethnicity",
      };
      const result = await request(server)
        .post(route)
        .set("x-auth-token", authToken)
        .send(body);
      const ethnicity = await Ethnicity.findOne(body);
      expect(ethnicity._id.toHexString()).toEqual(result.body._id);
    });
  });

  describe("PUT /api/ethnicities/:id", () => {
    const route = "/api/ethnicities/";

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

    it("should return 404 response and error body if ethnicity of given id is not available", async () => {
      const body = {
        name: "ethnicity",
      };
      const result = await request(server)
        .put(route + mongoose.Types.ObjectId().toHexString())
        .set("x-auth-token", authToken)
        .send(body);

      expect(result.status).toBe(404);
      expect(result.body.error).not.toBeNull();
    });

    it("should update the ethnicity of given id", async () => {
      const ethnicity = await new Ethnicity({
        name: "ethnicity",
      }).save();

      const body = {
        name: "updated name",
      };

      await request(server)
        .put(route + ethnicity._id.toHexString())
        .set("x-auth-token", authToken)
        .send(body);

      const updatedCategory = await Ethnicity.findById(ethnicity._id);

      expect(updatedCategory).toMatchObject(body);
      expect(ethnicity._id.toHexString()).toEqual(
        updatedCategory._id.toHexString()
      );
    });

    it("should return 200 status code with updated category", async () => {
      const ethnicity = await new Ethnicity({
        name: "ethnicity",
      }).save();

      const updateData = {
        name: "updated name",
      };

      const result = await request(server)
        .put(route + ethnicity._id.toHexString())
        .set("x-auth-token", authToken)
        .send(updateData);

      expect(result.body).toMatchObject(updateData);
      expect(result.body._id).toEqual(ethnicity._id.toHexString());
    });
  });

  describe("DELETE /api/ethnicities/:id", () => {
    const route = "/api/ethnicities/";

    let authToken = "";

    beforeEach(async () => {
      const { token } = await generateUserSession(ADMIN);
      authToken = token;
    });

    afterEach(cleanUserSession);

    it("should return 200 status code with deleted category", async () => {
      const ethnicity = await new Ethnicity({
        name: "ethnicity",
      }).save();

      const result = await request(server)
        .delete(route + ethnicity._id.toHexString())
        .set("x-auth-token", authToken);

      expect(result.status).toBe(200);
      expect(result.body._id).toEqual(ethnicity._id.toHexString());
    });

    it("should deleted the ethnicity of the given id", async () => {
      const ethnicity = await new Ethnicity({
        name: "ethnicity",
      }).save();

      await request(server)
        .delete(route + ethnicity._id.toHexString())
        .set("x-auth-token", authToken);

      const deleted = await Ethnicity.findById(ethnicity._id);
      expect(deleted).toBeNull();
    });
  });
});
