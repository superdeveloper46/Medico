using System;

namespace Medico.Application.ViewModels
{
    public class ProviderViewModel : BaseViewModel
    {
        public string Name { get; set; }

        public string Type { get; set; }

        public static Guid npiToGuid(int npi)
        {
            byte[] bytes = new byte[16];
            BitConverter.GetBytes(npi).CopyTo(bytes, 0);
            return new Guid(bytes);
        }
    }
}
