using System.ComponentModel.DataAnnotations;

namespace Medico.Application.ViewModels
{
  public class ChartColorViewModel : BaseViewModel
  {
    [Required] public string updated { get; set; }
    [Required] public string abnormal { get; set; }
    [Required] public string defaultOrIncomplete { get; set; }
    [Required] public string noContentChanged { get; set; }
    [Required] public string borderUpdated { get; set; }
    [Required] public string borderAbnormal { get; set; }
    [Required] public string borderDefaultOrIncomplete { get; set; }
    [Required] public string borderNoContentChanged { get; set; }

    public ChartColorViewModel()
    {
      this.updated = "";
      this.abnormal = "";
      this.defaultOrIncomplete = "";
      this.noContentChanged = "";
      this.borderUpdated = "";
      this.borderAbnormal = "";
      this.borderDefaultOrIncomplete = "";
      this.borderNoContentChanged = "";
    }
  }
}
