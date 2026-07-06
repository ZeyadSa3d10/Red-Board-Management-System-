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
            // Rebind the selector's body onto our shared `param`
            var reboundBody = ParameterReplacer.Replace(selector.Body, selector.Parameters[0], param);

            if (reboundBody.Type != typeof(string))
                continue;

            var notNull = Expression.NotEqual(reboundBody, Expression.Constant(null, typeof(string)));
            var toLower = Expression.Call(reboundBody, toLowerMethod!);
            var contains = Expression.Call(toLower, containsMethod!, Expression.Constant(searchLower));
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

    // Helper: replaces one ParameterExpression with another inside an expression tree
    private sealed class ParameterReplacer : ExpressionVisitor
    {
        private readonly ParameterExpression _from;
        private readonly Expression _to;

        private ParameterReplacer(ParameterExpression from, Expression to)
        {
            _from = from;
            _to = to;
        }

        public static Expression Replace(Expression body, ParameterExpression from, Expression to)
            => new ParameterReplacer(from, to).Visit(body);

        protected override Expression VisitParameter(ParameterExpression node)
            => node == _from ? _to : base.VisitParameter(node);
    }
}
