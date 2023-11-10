﻿using Medico.Domain.Enums;
using System;

namespace Medico.Domain.Models
{
    public class PatientIdentificationCode : Entity
    {
        public string Prefix { get; set; }
        
        public string LetterCode { get; set; }
        
        public string IdentificationCodeString { get; set; }
        
        public int NumericCode { get; set; }
        
        public PatientIdentificationCodeType Type { get; set; }
        
        public int? Year { get; set; }
        
        public int? Month { get; set; }
        
        public Company Company { get; set; }
        public Guid CompanyId { get; set; }
    }
}