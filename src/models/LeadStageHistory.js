const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class LeadStageHistory extends Model {
        static associate(models) {
            LeadStageHistory.belongsTo(models.Lead, {
                foreignKey: "lead_id",
                as: "lead",
            });
        }
    }

    LeadStageHistory.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            lead_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "leads",
                    key: "id",
                },
            },
            from_stage: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            to_stage: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                },
            },
            progression_type: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                    isIn: [["automatic", "manual", "system"]],
                },
            },
            trigger_event: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            changed_by: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            confidence_score: {
                type: DataTypes.DECIMAL(3, 2),
                allowNull: false,
                defaultValue: 0.0,
                validate: {
                    min: 0,
                    max: 1,
                },
            },
            qualifying_factors: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            disqualifying_factors: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            time_in_previous_stage: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    min: 0,
                },
            },
            conversation_context: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            changed_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: "LeadStageHistory",
            tableName: "lead_stage_history",
            timestamps: false,
            paranoid: false,
            indexes: [
                {
                    fields: ["lead_id"],
                },
                {
                    fields: ["to_stage"],
                },
                {
                    fields: ["changed_at"],
                },
            ],
        }
    );

    return LeadStageHistory;
};
