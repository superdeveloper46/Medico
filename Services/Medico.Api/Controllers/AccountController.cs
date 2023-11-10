using System;
using System.Collections;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Linq.Expressions;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Medico.Api.Email;
using Medico.Api.Url;
using Medico.Application.Interfaces;
using Medico.Application.ViewModels;
using Medico.Application.ViewModels.Patient;
using Medico.Identity.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Medico.Api.Controllers
{
    [Authorize]
    [Route("api/account")]
    public class AccountController : ApiController
    {
        #region DI
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly IUniqueUsernameService _uniqueUsernameService;
        private readonly ICompanyService _companyService;
        private readonly ISendEmailService _sendEmailService;
        private readonly IUrlService _urlService;
        private readonly IUserService _userService;
        private readonly IPatientUserEmailService _patientUserEmailService;
        private readonly IPatientService _patientService;
        private readonly IConfiguration _config;
        private readonly INotificationService _notificationService;

        public AccountController(UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            IUniqueUsernameService uniqueUsernameService,
            ICompanyService companyService,
            ISendEmailService sendEmailService,
            IUrlService urlService,
            IUserService userService,
            IPatientUserEmailService patientUserEmailService,
            IPatientService patientService,
            INotificationService notificationService,
            IConfiguration config,
            ICompanySecurityService companySecurityService):base(companySecurityService)
            
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _uniqueUsernameService = uniqueUsernameService;
            _companyService = companyService;
            _sendEmailService = sendEmailService;
            _urlService = urlService;
            _userService = userService;
            _patientUserEmailService = patientUserEmailService;
            _patientService = patientService;
            _notificationService = notificationService;
            _config = config;
        }
        #endregion

        #region Methods
        [HttpGet]
        [AllowAnonymous]
        [Route("email/{email}/company/{companyId}")]
        public async Task<ValidationResultViewModel> CheckEmailExistence(string email, Guid companyId)
        {
            var validationResult = new ValidationResultViewModel();
            var userName = _uniqueUsernameService.Get(email, companyId);

            var applicationUser = await _userManager.FindByNameAsync(userName);

            if (applicationUser == null)
            {
                validationResult.IsValid = true;
            }

            return validationResult;
        }

        [HttpPost]
        [Route("getAllEmail")]
        public async Task<IEnumerable<EmailMessage>> GetAllEmail()
        {

            var emails = await _sendEmailService.GetAllEmail();
            foreach (var email in emails)
            {
                String sender = email.From.EmailAddress.Name;
                String senderEmail = email.From.EmailAddress.Address;
                NotificationViewModel notificationViewModel = new NotificationViewModel
                {
                    Description = email.Body.Content,
                    Title = sender + " (" + senderEmail + ")",
                    ParentId = 0,
                    NotificationTypeId = 1,
                    MessageTypeId = "Message",
                    Priority = "Medium",
                    CreatedBy = CurrentUserId,
                    CreatedOn = DateTime.UtcNow.AddHours(-7),
                    CreateDate = DateTime.UtcNow.AddHours(-7),
                    Archive = false
                };

                int notifyId = await _notificationService.Create(notificationViewModel);

                if (notifyId > 0)
                {
                    string[] userids = new string[]{CurrentUserId};
                    await _notificationService.MapParentNotification(notifyId, userids);
                }
            }
            return emails;
        }

        [HttpPost]
        [Route("password/resetresult")]
        public async Task<bool> ResetPassword([FromBody] LoginViewModel loginViewModel)
        {
            if (!ModelState.IsValid)
                return false;

            var user = await _userManager.FindByEmailAsync(loginViewModel.Email);
            if (user == null)
                return false;

            var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
            var passwordChangeResult =
                await _userManager.ResetPasswordAsync(user, resetToken, loginViewModel.Password);

            return passwordChangeResult.Succeeded;
        }

        [AllowAnonymous]
        [HttpPost]
        [Route("password/resetbyuserid")]
        public async Task<bool> ResetPasswordByUserId([FromBody] ResetPasswordViewModel resetPasswordViewModel)
        {
            if (!ModelState.IsValid)
                return false;

            var user = await _userManager.FindByIdAsync(resetPasswordViewModel.UserId);
            if (user == null)
                return false;

            if (string.IsNullOrEmpty(resetPasswordViewModel.Code))
            {
                var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
                var passwordChangeResult =
                    await _userManager.ResetPasswordAsync(user, resetToken, resetPasswordViewModel.Password);
                return passwordChangeResult.Succeeded;
            }
            else
            {
                var originalCode =
                    Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(resetPasswordViewModel.Code));
                var passwordChangeResult =
                    await _userManager.ResetPasswordAsync(user, originalCode, resetPasswordViewModel.Password);
                return passwordChangeResult.Succeeded;
            }
        }

        [AllowAnonymous]
        [HttpPost]
        [Route("password")]
        public async Task<bool> Post([FromBody] LoginViewModel loginViewModel)
        {
            if (!ModelState.IsValid)
                return false;

            var user = await _userManager.FindByEmailAsync(loginViewModel.Email);
            if (user == null)
                return false;

            var validationResult = _userManager.PasswordHasher.VerifyHashedPassword(user,
                user.PasswordHash, loginViewModel.Password);

            return validationResult == PasswordVerificationResult.Success;
        }

        [HttpGet]
        [AllowAnonymous]
        [Route("password/{password}")]
        public async Task<ValidationResultViewModel> CheckPasswordComplexity(string password)
        {
            var validationResult = new ValidationResultViewModel();

            var passwordValidator = new PasswordValidator<ApplicationUser>();
            var result = await passwordValidator
                .ValidateAsync(_userManager, null, password);

            validationResult.IsValid = result.Succeeded;

            return validationResult;
        }

        [Route("patient/login")]
        [HttpPost]
        [AllowAnonymous]
        public async Task<PatientLoginResponseVm> PatientLogIn([FromBody] PatientLoginVm patientLoginVm)
        {
            var companyId = patientLoginVm.CompanyId;

            var patientLoginResponse = new PatientLoginResponseVm();

            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Values.SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage);

                patientLoginResponse.Errors.AddRange(errors);

                return patientLoginResponse;
            }

            var patientsUsers = await _userService
                .GetPatientsUsers(patientLoginVm.FirstName, patientLoginVm.LastName,
                    patientLoginVm.DateOfBirth, companyId);

            if (patientsUsers.Count > 1)
            {
                patientLoginResponse.Errors.Add(
                    $"The user {patientLoginVm.FirstName} {patientLoginVm.LastName} is found twice. Please, contact administrator.");

                return patientLoginResponse;
            }

            if (!patientsUsers.Any() || patientsUsers.Single().CompanyId != companyId)
            {
                patientLoginResponse.Errors.Add(
                    $"The user {patientLoginVm.FirstName} {patientLoginVm.LastName} doesn't exist in the company.");

                return patientLoginResponse;
            }

            var patientUser = patientsUsers.Single();

            var patientId = _patientUserEmailService
                .ExtractPatientIdFromEmail(patientUser.Email);

            var patient = await _patientService.GetById(patientId);
            if (patient == null)
            {
                patientLoginResponse.Errors.Add(
                    $"The user {patientLoginVm.FirstName} {patientLoginVm.LastName} doesn't exist in the company.");

                return patientLoginResponse;
            }

            var patientUserName = _uniqueUsernameService.Get(patientUser.Email, companyId);

            var company = await _companyService.GetById(companyId);
            if (company != null && !company.IsActive)
            {
                patientLoginResponse.Errors.Add("The company where user is registered is inactive.");
                return patientLoginResponse;
            }

            var result = await _signInManager
                .PasswordSignInAsync(patientUserName, patientLoginVm.Password, false, true);

            if (!result.Succeeded)
            {
                patientLoginResponse.Errors.Add("The password is wrong");
                return patientLoginResponse;
            }

            patientLoginResponse.PatientUser.IsAuthenticated = true;
            patientLoginResponse.PatientUser.PatientId = patientId;
            patientLoginResponse.PatientUser.CompanyId = companyId;

            return patientLoginResponse;
        }

        [Route("login")]
        [HttpPost]
        [AllowAnonymous]
        public async Task<ApplicationUserViewModel> LogIn([FromBody] LoginViewModel loginViewModel)
        {
            var companyId = loginViewModel.CompanyId;

            var applicationUserViewModel = new ApplicationUserViewModel
            {
                IsAuthenticated = false,
                CompanyId = companyId,
                Email = loginViewModel.Email
            };

            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Values.SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage);

                applicationUserViewModel.Errors.AddRange(errors);

                return applicationUserViewModel;
            }

            var email = loginViewModel.Email;
            var username = _uniqueUsernameService.Get(email, companyId);

            var applicationUser = await _userManager.FindByNameAsync(username)
                                  ?? await _userManager.FindByEmailAsync(email);

            if (applicationUser == null ||
                applicationUser.CompanyId != null && applicationUser.CompanyId.Value != companyId)
            {
                applicationUserViewModel.Errors.Add(
                    $"The user with such email '{loginViewModel.Email}' doesn't exist in the company.");
                return applicationUserViewModel;
            }

            var company = await _companyService.GetById(companyId);
            if (company != null && !company.IsActive)
            {
                applicationUserViewModel.Errors.Add("The company where user is registered is inactive.");
                return applicationUserViewModel;
            }

            var result = await _signInManager
                .PasswordSignInAsync(applicationUser.UserName, loginViewModel.Password, false, true);

            if (!result.Succeeded)
            {
                applicationUserViewModel.Errors.Add("The password is wrong");
                return applicationUserViewModel;
            }

            var userRoles = await _userManager.GetRolesAsync(applicationUser);

            applicationUserViewModel.IsAuthenticated = true;

            foreach (var userRole in userRoles)
            {
                applicationUserViewModel.Roles.Add(userRole);
            }

            var tokenString = GenerateJWT(applicationUser);
            applicationUserViewModel.Token = tokenString;

            var fullName = "Super Admin";
            // get First, last name
            var loadOptions = new UserDxOptionsViewModel
            {
                CompanyId = companyId,
            };
            var userQuery = _userService.GetAll()
                .FirstOrDefault(c => c.Email == email);

            if (userQuery != null)
            {
                fullName = $"{userQuery.FirstName} {userQuery.LastName}";
            }
            applicationUserViewModel.FullName = fullName;

            return applicationUserViewModel;
        }

        [Route("login")]
        [HttpGet]
        [AllowAnonymous]
        public IActionResult NotAuthorized()
        {
            return Unauthorized();
        }

        [Route("forbid")]
        [HttpGet]
        [AllowAnonymous]
        public IActionResult AccessDenied()
        {
            return StatusCode(403);
        }

        [Route("logout")]
        [HttpPost]
        public async Task<IActionResult> Logout()
        {
            await _signInManager.SignOutAsync();
            return Ok();
        }

        [AllowAnonymous]
        [HttpGet]
        [Route("confirm-email")]
        public async Task<ValidationResultViewModel> ConfirmEmail(string userId, string code)
        {
            var validationResult = new ValidationResultViewModel();

            if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(code))
            {
                return validationResult;
            }

            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
                return validationResult;

            if (user.EmailConfirmed)
            {
                return validationResult;
            }
            else
            {
                var originalCode =
                    Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(code));

                var result = await _userManager.ConfirmEmailAsync(user, originalCode);

                if (result.Succeeded)
                {
                    validationResult.IsValid = true;
                }
            }

            return validationResult;
        }

        [AllowAnonymous]
        [Route("forgot-password/email/{email}")]
        [HttpGet]
        public async Task<ValidationResultViewModel> ForgotPassword(string email)
        {
            var validationResult = new ValidationResultViewModel();

            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
                return validationResult;

            validationResult.IsValid = true;

            var code =
                await _userManager.GeneratePasswordResetTokenAsync(user);

            //token may contain some special characters that should be encoded
            var encodedCode =
                WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(code));

            var forgotPasswordUrl = _urlService
                .GenerateForgotPasswordUrl(user.Id, encodedCode);

            var forgotPasswordHeader = string.Format(EmailTemplates.UserForgotPassword.Subject);

            var forgotPasswordBody = string.Format(EmailTemplates.UserForgotPassword.Body,
                forgotPasswordUrl);

            //await _sendEmailService.SendEmailAsync("chauhan.munish1@gmail.com", forgotPasswordHeader, forgotPasswordBody);
            var emailModel = new EmailViewModel
            {
                To = email,
                Subject = forgotPasswordHeader,
            };
            string appUrl = "https://medicophysicians.azurewebsites.net/";
            await SendResetPasswordMail(emailModel, user.UserName, encodedCode, forgotPasswordUrl, appUrl);

            return validationResult;
        }
        #endregion

        #region Non Action
        string GenerateJWT(ApplicationUser applicationUser)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:SecretKey"]));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, applicationUser.UserName),
                new Claim("UserId", applicationUser.Id),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            };

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddMinutes(30),
                signingCredentials: credentials
            );
            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private async Task SendResetPasswordMail(EmailViewModel emailModel, string username, string encodedCode,
            Uri forgotPasswordUrl, string baseUrl)
        {
            try
            {
                EmailAccountViewModel emailAccount = await _sendEmailService.GetEmailAccount();
                var email = new EmailViewModel
                {
                    FromName = emailAccount.FromName,
                    To = emailModel.To,
                    BccList = emailAccount.Bcc,
                    Subject = string.Format("Reset your {0} password", emailAccount.AppName)
                };

                Hashtable ht = new Hashtable
                {
                    { "@Username", username },
                    { "@AppName", emailAccount.AppName },
                    { "@Code", encodedCode},
                    { "@ResetLink", $"{forgotPasswordUrl}" },
                    { "@BaseUrl", $"{baseUrl}" },
                    { "@CompanyName",emailAccount.AppName },
                };

                email.HashValues = ht;
                email.TemplateName = "forgot_password";

                await _sendEmailService.Execute(email, emailAccount);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }
        #endregion
    }
}