const _ = require("lodash");
const moment = require("moment");

exports.getDatesOfRepeatingDays = (startDate, endDate, repeatingDays = []) => {
  startDate = moment(startDate, "MM/DD/YYYY");
  endDate = moment(endDate, "MM/DD/YYYY").toDate();
  const result = [];
  while (startDate.toDate() <= endDate) {
    const dayName = startDate.format("dddd").toLowerCase();
    if (repeatingDays.includes(dayName)) {
      result.push(startDate.toDate());
    }
    startDate.add(1, "days");
  }
  return result;
};

exports.makeMilestone = (ms) => {
  //if repeating
  if (ms.repeatingDays.length === 0)
    return {
      ..._.pick(ms, [
        "_id",
        "title",
        "goal",
        "startDate",
        "endDate",
        "repeatingDays",
        "timeOfDay",
        "frequency",
        "members",
      ]),
      occuringDate: moment(ms.startDate).format("MM/DD/YYYY"),
      isCompleted: ms.completedDates.includes(
        moment(ms.startDate).format("MM/DD/YYYY")
      ),
      isRepeating: false,
    };

  //if occuring on multiple days.
  const result = [];
  ms.repeatingDates.forEach((repeatingDate) => {
    let isCompleted = ms.completedDates.includes(repeatingDate);

    result.push({
      ..._.pick(ms, [
        "_id",
        "title",
        "goal",
        "startDate",
        "endDate",
        "repeatingDays",
        "timeOfDay",
        "frequency",
        "members",
      ]),
      occuringDate: repeatingDate,
      isCompleted,
      isRepeating: true,
    });
  });

  return result;
};
