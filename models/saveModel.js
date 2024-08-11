const { default: mongoose } = require("mongoose");

const saveSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "user",
        },
        savedItems: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    ref: "products",
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

const Save = mongoose.model("Save", saveSchema);
module.exports = Save;