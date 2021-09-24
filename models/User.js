const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ImageMedia = require("./media/ImageMedia");

const roles = require("../enums/roles");
const subscription_plans = require("../enums/subscription_plans");

const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["Point"],
    required: true,
  },
  coordinates: {
    type: [Number],
    required: true,
  },
});

const userSchema = new mongoose.Schema({
  firstname: {
    type: String,
    trim: true,
  },

  lastname: {
    type: String,
    trim: true,
  },

  email: {
    type: String,
    trim: true,
    index: true,
  },

  image: ImageMedia.schema,

  password: {
    type: String,
    default: "",
  },

  ageRange: {
    type: String,
  },

  gender: {
    type: String,
    enum: ["male", "female"],
  },

  dateOfBirth: {
    type: Date,
  },

  relationshipStatus: {
    type: String,
  },

  employmentStatus: {
    type: String,
    enum: ["employed", "unemployed"],
  },

  numberOfchildrens: {
    type: Number,
  },

  topHobbies: {
    type: [String],
  },

  ethnicity: {
    type: String,
  },

  emailVerified: {
    type: Boolean,
    default: false,
  },

  chatCount: {
    type: Number,
    default: 0,
  },

  notificationCount: {
    type: Number,
    default: 0,
  },

  emailVerificationCode: {
    type: String,
    trim: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  passwordResetCode: {
    type: String,
    trim: true,
  },

  role: {
    type: String,
    trim: true,
    default: roles.USER,
    enum: Object.entries(roles).map((role) => role[1]),
  },

  timezone: {
    type: String,
    default: "",
    index: true,
  },

  activeGoals: {
    type: Number,
    default: 0,
  },

  location: {
    type: pointSchema,
    index: "2dsphere",
  },

  stripeCustomerId: {
    type: String,
    default: "",
  },

  trialAvailed: {
    type: Boolean,
    default: false,
  },

  subscription: {
    paymentMethod: {
      type: String,
      enum: ["google_pay", "apple_pay"],
    },

    paymentToken: {
      type: String,
    },

    subscriptionId: {
      type: String,
    },

    type: {
      type: String,
      trim: true,
      default: "FREE",
      enum: Object.entries(subscription_plans).map((plan) => plan.name),
    },

    subscriptionStart: {
      type: Date,
    },

    subscriptionEnd: {
      type: Date,
    },

    maxActiveGoals: {
      type: Number,
      default: 1,
    },

    isUnlimited: {
      type: Boolean,
      default: true,
    },

    isTrial: {
      type: Boolean,
    },
  },

  categoryScore: {
    type: Object,
  },

  categoryStars: {
    type: Object,
  },

  wellnessScore: {
    type: Number,
    default: 0,
  },

  clarityOnPurposeScore: {
    type: Number,
    default: 0,
  },

  notificationSettings: {
    emailChatNotifications: {
      type: Boolean,
      default: true,
    },
    textChatNotifications: {
      type: Boolean,
      default: true,
    },
    emailMilestoneNotifications: {
      type: Boolean,
      default: true,
    },
    textMilestoneNotifications: {
      type: Boolean,
      default: true,
    },

    affirmationReminderTime: {
      state: {
        type: Boolean,
        default: true,
      },
      amTime: {
        type: String,
        default: "07:00",
      },
      pmTime: {
        type: String,
        default: "20:00",
      },
    },

    goalPlan: {
      state: {
        type: Boolean,
        default: true,
      },
      reminderTime: {
        type: String,
        default: "12:00",
      },
    },
    eCoaching: {
      state: {
        type: Boolean,
        default: true,
      },
      numberOfNotifications: {
        type: Number,
        default: 7,
      },
      startTime: {
        type: String,
        default: "07:00",
      },
      endTime: {
        type: String,
        default: "20:00",
      },
    },

    prayers: {
      state: {
        type: Boolean,
        default: true,
      },
      numberOfNotifications: {
        type: Number,
        default: 7,
      },
      startTime: {
        type: String,
        default: "07:00",
      },
      endTime: {
        type: String,
        default: "20:00",
      },
    },

    motivationalQoutes: {
      state: {
        type: Boolean,
        default: true,
      },
      numberOfNotifications: {
        type: Number,
        default: 7,
      },
      startTime: {
        type: String,
        default: "07:00",
      },
      endTime: {
        type: String,
        default: "20:00",
      },
    },

    extraAffirmations: {
      state: {
        type: Boolean,
        default: true,
      },
      numberOfNotifications: {
        type: Number,
        default: 7,
      },
      startTime: {
        type: String,
        default: "07:00",
      },
      endTime: {
        type: String,
        default: "20:00",
      },
    },
  },
});

userSchema.methods.hashPassword = async function (password) {
  //generating password hash
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const genereteRandomCode = () => Math.floor(100000 + Math.random() * 900000);

userSchema.methods.generateEmailVerificationCode = function () {
  if (!this.emailVerificationCode)
    this.emailVerificationCode = genereteRandomCode();
  return this.emailVerificationCode;
};

userSchema.methods.generatePasswordResetCode = function () {
  this.passwordResetCode = genereteRandomCode();
  return this.passwordResetCode;
};

const User = mongoose.model("user", userSchema);

module.exports = User;
