const yup = require("yup");

const createPrayerSchema = yup.object().shape({
  name: yup.string().trim().min(1).required(),
  prayer: yup.string().trim().min(1).required(),
  translation: yup.string().trim().optional(),
  type: yup.string().trim().min(1).required(),
  prayerDays: yup.array().of(yup.string().required()).optional(),
});

module.exports = {
  createPrayerSchema,
  editPrayerSchema: createPrayerSchema,
};
