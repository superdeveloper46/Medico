using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using HtmlAgilityPack;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Medico.Application.ViewModels.Patient;
using Medico.Data.Repository;
using Medico.Domain.Constants;
using Medico.Domain.Interfaces;
using Medico.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace Medico.Application.Services
{
    public class VariableService : IVariableService
    {
        private const string PatientChartIdAttrName = "var-id";
        private const string IdAttrName = "id";
        private const string PatientChartItemTagName = "label";

        private const string DetailedContentContainerId = "detailed-content-container";

        private readonly string _htmlDocumentFormat =
            $@"<!doctype html>
                <html>
                    <body>
                        <div id=""{DetailedContentContainerId}"">{{0}}</div>
                    </body>
                </html>";

        public VariableService() : base()
        {
            
        }

        public string calculateInTemplate(IAdmissionService admissionService, string templateContent, Guid admissionId, Guid patientId, Guid companyId)
        {
            DateTime now = DateTime.Now;

            var htmlDocumentString = string.Format(_htmlDocumentFormat, templateContent);

            var rootDocument = new HtmlDocument();
            rootDocument.LoadHtml(htmlDocumentString);

            var selectableHtmlElementQuerySelector =
                $@"//{PatientChartItemTagName}[@{PatientChartIdAttrName}]";

            var patientChartNodes = rootDocument.DocumentNode.SelectNodes(selectableHtmlElementQuerySelector);
            if (patientChartNodes == null || !patientChartNodes.Any())
                return templateContent;

            foreach (HtmlNode patientChartNode in patientChartNodes)
            {
                patientChartNode.InnerHtml = now.ToString("F");
            }

            return rootDocument.DocumentNode.SelectNodes($"//div[@id='{DetailedContentContainerId}']")[0].InnerHtml;
        }
    }
}