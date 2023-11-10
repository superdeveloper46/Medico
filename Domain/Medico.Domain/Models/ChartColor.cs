namespace Medico.Domain.Models
{
  public class ChartColor : Entity
{
    public string updated { get; set; }
    public string abnormal { get; set; }
    public string defaultOrIncomplete { get; set; }
    public string noContentChanged { get; set; }
    public string borderUpdated { get; set; }
    public string borderAbnormal { get; set; }
    public string borderDefaultOrIncomplete { get; set; }
    public string borderNoContentChanged { get; set; }

    public ChartColor()
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
