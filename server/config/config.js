const config = {
    production: {
        SECRET: process.env.SECRET,
        DATABASE: process.env.MONGODB_URI
    },
    default: {
        SECRET: 'mysecretkey',
        DATABASE: 'mongodb://localhost/books_shelf'
    }
}
exports.get = function get(env) {
    return config[env] || config.default;
}