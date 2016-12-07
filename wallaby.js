module.exports = function () {
    return {
        files: [
            "src/**/*.coffee"
        ],

        tests: [
            "test/**/*Test.coffee"
        ],
        env: {
            type: "node"
        }
    };
};