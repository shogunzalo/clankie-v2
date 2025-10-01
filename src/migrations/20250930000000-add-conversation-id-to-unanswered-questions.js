module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(
            "unanswered_questions",
            "conversation_id",
            {
                type: Sequelize.INTEGER,
                allowNull: true,
                comment: "ID of the conversation where the question was asked",
            }
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn(
            "unanswered_questions",
            "conversation_id"
        );
    },
};
