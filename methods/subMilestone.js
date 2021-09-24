const _ = require("lodash");

exports.makeSubMilestone = (sMs, occuringDate) => {
  return {
    ..._.pick(sMs, ["_id", "title", "milestone", "createdBy", "createdAt"]),
    isCompleted: sMs.completedDates.includes(occuringDate),
  };
};
