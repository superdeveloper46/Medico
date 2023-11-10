using System;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Medico.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Medico.Application.Services
{
    public class MedicationClassService : IMedicationClassService
    {
        private readonly IMedicationClassRepository _medicationClassRepository;
        private readonly IMapper _mapper;
        public MedicationClassService(IMedicationClassRepository medicationClassRepository, IMapper mapper)
        {
            _medicationClassRepository = medicationClassRepository;
            _mapper = mapper;
        }

        public IQueryable<LookupViewModel> GetAllForLookup(DxOptionsViewModel loadOptions, int lookupItemsCount)
        {
            loadOptions.PrimaryKey = new[] { "Id" };
            loadOptions.PaginateViaPrimaryKey = true;

            var takeItemsCount = loadOptions.Take;
            loadOptions.Take = takeItemsCount != 0 ? takeItemsCount : lookupItemsCount;

            return _medicationClassRepository.GetAll().ProjectTo<LookupViewModel>(_mapper.ConfigurationProvider);
        }

        public async Task<LookupViewModel> GetById(Guid id)
        {
            var medicationClass = await _medicationClassRepository.GetAll()
                .FirstOrDefaultAsync(a => a.Id == id);

            return medicationClass == null
                ? null
                : _mapper.Map<LookupViewModel>(medicationClass);
        }
    }
}
