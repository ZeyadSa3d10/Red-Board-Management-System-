using BuildingMaterials.Application.DTOs;
using BuildingMaterials.Application.DTOs.Client;

namespace BuildingMaterials.Application.Services.Interfaces;

public interface IClientService
{
    Task<PagedResult<ClientDto>> GetFilteredAsync(ClientFilterDto filter);
    Task<IEnumerable<ClientDto>> GetAllAsync();
    Task<ClientDto> GetByIdAsync(int id);
    Task<ClientDto> CreateAsync(CreateClientDto dto);
    Task UpdateAsync(int id, UpdateClientDto dto);
    Task<IEnumerable<ClientDto>> GetWithDeferredAsync();
    Task AddPaymentAsync(int clientId, ClientPaymentDto dto, int employeeId);
    Task<IEnumerable<ClientPaymentResponseDto>> GetPaymentsAsync(int clientId, int? branchId = null);
    Task<ClientStatementDto> GetStatementAsync(int clientId);
}
