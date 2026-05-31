using AutoMapper;
using BuildingMaterials.Application.DTOs.Branch;
using BuildingMaterials.Application.Services.Interfaces;
using BuildingMaterials.Domain.Entities;
using BuildingMaterials.Domain.Exceptions;
using BuildingMaterials.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace BuildingMaterials.Application.Services;

public class BranchService : IBranchService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly IMemoryCache _cache;
    private const string CACHE_KEY_ALL = "branches_all";

    public BranchService(AppDbContext context, IMapper mapper, IMemoryCache cache)
    {
        _context = context;
        _mapper = mapper;
        _cache = cache;
    }

    public async Task<IEnumerable<BranchDto>> GetAllAsync()
    {
        if (_cache.TryGetValue(CACHE_KEY_ALL, out IEnumerable<BranchDto>? cached) && cached != null)
            return cached;

        var branches = await _context.Branches
            .Where(x => !x.IsAdminBranch)
            .ToListAsync();
        var result = _mapper.Map<IEnumerable<BranchDto>>(branches);
        _cache.Set(CACHE_KEY_ALL, result, TimeSpan.FromMinutes(10));
        return result;
    }

    public async Task<BranchDto> GetByIdAsync(int id)
    {
        var branch = await _context.Branches.FindAsync(id)
            ?? throw new NotFoundException("الفرع غير موجود");
        return _mapper.Map<BranchDto>(branch);
    }

    public async Task<BranchDto> CreateAsync(CreateBranchDto dto)
    {
        var branch = _mapper.Map<Branch>(dto);
        _context.Branches.Add(branch);
        await _context.SaveChangesAsync();
        _cache.Remove(CACHE_KEY_ALL);
        return _mapper.Map<BranchDto>(branch);
    }

    public async Task UpdateAsync(int id, CreateBranchDto dto)
    {
        var branch = await _context.Branches.FindAsync(id)
            ?? throw new NotFoundException("الفرع غير موجود");
        _mapper.Map(dto, branch);
        await _context.SaveChangesAsync();
        _cache.Remove(CACHE_KEY_ALL);
    }
}
