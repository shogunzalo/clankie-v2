const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class Lead extends Model {
        static associate(models) {
            Lead.belongsTo(models.Business, {
                foreignKey: "business_id",
                as: "business",
            });

            Lead.belongsTo(models.Client, {
                foreignKey: "client_id",
                as: "client",
            });

            Lead.belongsTo(models.Conversation, {
                foreignKey: "conversation_id",
                as: "conversation",
            });

            Lead.hasMany(models.LeadStageHistory, {
                foreignKey: "lead_id",
                as: "stageHistory",
            });
        }
    }

    Lead.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            business_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "businesses",
                    key: "id",
                },
            },
            client_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "clients",
                    key: "id",
                },
            },
            conversation_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "conversations",
                    key: "id",
                },
            },
            lead_source: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                },
            },
            lead_type: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                    isIn: [
                        ["inbound", "outbound", "referral", "organic", "paid"],
                    ],
                },
            },
            current_stage: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "new",
                validate: {
                    isIn: [
                        [
                            "new",
                            "contacted",
                            "qualified",
                            "proposal",
                            "negotiation",
                            "closed_won",
                            "closed_lost",
                        ],
                    ],
                },
            },
            previous_stage: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            stage_progression_count: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    min: 0,
                },
            },
            qualification_score: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    min: 0,
                    max: 100,
                },
            },
            interest_level: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    min: 0,
                    max: 10,
                },
            },
            engagement_level: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    min: 0,
                    max: 10,
                },
            },
            service_interest: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            budget_indication: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            timeline_indication: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            decision_maker_status: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            converted_to: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            conversion_value: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0.0,
                validate: {
                    min: 0,
                },
            },
            lost_reason: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            stage_entered_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            time_in_current_stage: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    min: 0,
                },
            },
            total_funnel_time: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    min: 0,
                },
            },
            final_outcome: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            outcome_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: "Lead",
            tableName: "leads",
            timestamps: true,
            paranoid: false,
            indexes: [
                {
                    fields: ["business_id", "current_stage"],
                },
                {
                    fields: ["qualification_score"],
                },
                {
                    fields: ["lead_type"],
                },
                {
                    fields: ["stage_entered_at"],
                },
                {
                    fields: ["conversion_value"],
                },
            ],
        }
    );

    return Lead;
};
