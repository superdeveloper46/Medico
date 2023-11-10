using System;
using System.Collections;

namespace Medico.Application.ViewModels
{
    public class EmailMessage
    {
        public string Id { get; set; }
        public DateTime CreatedDateTime { get; set; }
        public DateTime ReceivedDateTime { get; set; }
        public DateTime SentDateTime { get; set; }
        public string Subject { get; set; }
        public string BodyPreview { get; set; }
        public string IMportance { get; set; }
        public string InferenceClassification { get; set; }
        public Body Body { get; set; }
        public FromType From { get; set; }
        public FromType Sender { get; set; }
    }

    public class Body {
        public string ContentType { get; set; }
        public string Content { get; set; }
    }

    public class FromType {
        public EmailAddressType EmailAddress { get; set; }
    }

    public class EmailAddressType {
        public string Name { get; set; }
        public string Address { get; set; }
    }


}
