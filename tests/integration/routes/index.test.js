const request = require("supertest");
let server;
describe("/", () => {
  beforeEach(() => {
    server = require("../../../index");
  });
  afterEach(() => {
    server.close();
  });

  describe("GET /", () => {
    it("should return 200 response", async () => {
      const result = await request(server).get("/");
      expect(result.status).toBe(200);
    });
  });
});
