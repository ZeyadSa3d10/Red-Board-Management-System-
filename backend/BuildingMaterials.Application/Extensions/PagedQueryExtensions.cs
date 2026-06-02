using AutoMapper;
using BuildingMaterials.Application.DTOs;
using BuildingMaterials.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;

namespace BuildingMaterials.Application.Extensions;

public static class PagedQueryExtensions
{
    public static async Task<PagedResult<TDto>> ToPagedResultAsync<T, TDto>(
        this IQueryable<T> query,
        PagedFilterDto filter,
        IMapper mapper)
    {
        var totalCount = await query.CountAsync();

        query = query.ApplySorting(filter.SortBy, filter.SortDirection);
        var items = await query
            .ApplyPaging(filter.PageNumber, filter.PageSize)
            .ToListAsync();

        return new PagedResult<TDto>
        {
            Items = mapper.Map<List<TDto>>(items),
            TotalCount = totalCount,
            PageNumber = filter.PageNumber,
            PageSize = filter.PageSize,
            SortBy = filter.SortBy ?? "CreatedAt",
            SortDirection = filter.SortDirection ?? "desc"
        };
    }
}
