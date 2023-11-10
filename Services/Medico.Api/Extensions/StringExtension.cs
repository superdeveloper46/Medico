using System.Text;

namespace Medico.Api.Extensions
{
    public static class StringExtension
    {
        public static string CapitalizeFirst(this string s)
        {
            if (string.IsNullOrEmpty(s))
                return string.Empty;

            s = s.ToLower();
            bool IsNewSentense = true;
            var result = new StringBuilder(s.Length);
            for (int i = 0; i < s.Length; i++)
            {
                if (IsNewSentense && char.IsLetter(s[i]))
                {
                    result.Append(char.ToUpper(s[i]));
                    IsNewSentense = false;
                }
                else
                    result.Append(s[i]);

                if (s[i] == '!' || s[i] == '?' || s[i] == '.')
                {
                    IsNewSentense = true;
                }
            }

            return result.ToString();
        }
    }
}
