namespace Medico.Api.Constants
{
    public class AppConstants
    {
        public static class SearchConfiguration
        {
            public const int LookupItemsCount = 20;
        }

        public static class BuildInRoleNames
        {
            public const string SuperAdmin = "SuperAdmin";

            public const string Physician = "Physician";

            public const string Nurse = "Nurse";

            public const string MedicalAssistant = "MedicalAssistant";

            public const string Admin = "Admin";
            
            public const string Patient = "Patient";
        }

        public static class BuildInUsers
        {
            public static class SuperAdmin
            {
                public const string Name = "SuperAdmin";

                public const string Email = "superadmin@mail.com";
            }
        }
    }
}
