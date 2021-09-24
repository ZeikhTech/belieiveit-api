const db = require("../../../utils/db");
const mongoose = require("mongoose");

describe("db", () => {
  it("should connect to database if connectionString is passed", () => {
    const connectionString = "some_database_connection_string";
    mongoose.connect = jest.fn();
    mongoose.connect.mockResolvedValue(1);
    db(connectionString);
    expect(mongoose.connect).toHaveBeenCalled();
    expect(mongoose.connect.mock.calls[0][0]).toBe(connectionString);
  });

  it("should throw if connectionString is not string", () => {
    expect(db).rejects.toThrow();
  });
});
