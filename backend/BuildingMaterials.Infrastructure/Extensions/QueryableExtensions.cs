using System.Linq.Expressions;

namespace BuildingMaterials.Infrastructure.Extensions;

public static class QueryableExtensions
{
    public static IQueryable<T> ApplySearch<T>(
        this IQueryable<T> query,
        string? search,
        params Expression<Func<T, string?>>[] fieldSelectors)
    {
        if (string.IsNullOrWhiteSpace(search))
            return query;

        var param = Expression.Parameter(typeof(T), "x");
        Expression? orExpression = null;
        var containsMethod = typeof(string).GetMethod("Contains", new[] { typeof(string) });
        var toLowerMethod = typeof(string).GetMethod("ToLower", Type.EmptyTypes);
        var searchLower = search.ToLower();

        foreach (var selector in fieldSelectors)
        {
            var propertyAccess = selector.Body;
            if (propertyAccess.Type != typeof(string))
                continue;

            var toLower = Expression.Call(propertyAccess, toLowerMethod);
            var contains = Expression.Call(toLower, containsMethod, Expression.Constant(searchLower));
            var notNull = Expression.NotEqual(propertyAccess, Expression.Constant(null, typeof(string)));
            var safeExpr = Expression.AndAlso(notNull, contains);

            orExpression = orExpression == null ? safeExpr : Expression.OrElse(orExpression, safeExpr);
        }

        if (orExpression == null)
            return query;

        var lambda = Expression.Lambda<Func<T, bool>>(orExpression, param);
        return query.Where(lambda);
    }

    public static IQueryable<T> ApplyWhereIf<T>(
        this IQueryable<T> query,
        bool condition,
        Expression<Func<T, bool>> predicate)
    {
        return condition ? query.Where(predicate) : query;
    }

    public static IQueryable<T> ApplySorting<T>(
        this IQueryable<T> query,
        string? sortBy,
        string? sortDir = "desc")
    {
        if (string.IsNullOrWhiteSpace(sortBy))
            sortBy = "CreatedAt";

        var isDescending = string.Equals(sortDir, "desc", StringComparison.OrdinalIgnoreCase);
        var param = Expression.Parameter(typeof(T), "x");
        var property = Expression.PropertyOrField(param, sortBy);
        var lambda = Expression.Lambda(property, param);
        var methodName = isDescending ? "OrderByDescending" : "OrderBy";

        var resultExpression = Expression.Call(
            typeof(Queryable), methodName,
            new[] { typeof(T), property.Type },
            query.Expression, Expression.Quote(lambda));

        return query.Provider.CreateQuery<T>(resultExpression);
    }

    public static IQueryable<T> ApplyPaging<T>(
        this IQueryable<T> query,
        int pageNumber,
        int pageSize)
    {
        return query.Skip((pageNumber - 1) * pageSize).Take(pageSize);
    }
}
