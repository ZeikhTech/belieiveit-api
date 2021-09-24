const request = require("supertest");

const jwt = require("../../../../services/jwt");

const {
  generateUserSession,
  cleanUserSession,
} = require("../../test_helpers/userSessionHelper");
const { USER } = require("../../../../enums/roles");

let server;
describe("/api/subscription", () => {
  beforeEach(() => {
    server = require("../../../../index");
  });
  afterEach(async () => {
    server.close();
    await cleanUserSession();
  });

  it("", async () => {});
});
