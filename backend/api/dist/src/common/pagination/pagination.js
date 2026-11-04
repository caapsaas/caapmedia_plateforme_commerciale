"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginate = paginate;
async function paginate(model, query = {}, options = { page: 1, limit: 10 }) {
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 10;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
        model.findMany({
            ...query,
            skip,
            take: limit,
        }),
        model.count({
            where: query.where || {},
        }),
    ]);
    const totalPages = Math.ceil(total / limit);
    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        },
    };
}
//# sourceMappingURL=pagination.js.map