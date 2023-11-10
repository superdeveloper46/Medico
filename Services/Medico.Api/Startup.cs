using Medico.Api.Configurations;
using Medico.Api.Helpers;
using Medico.Api.HostedServices;
using Medico.Api.Middlewares;
using Medico.Api.ModelBinding;
using Medico.Api.Url;
using Medico.Application.ViewModels;
using Medico.Identity.Data;
using Medico.Identity.Middleware;
using Medico.Identity.Models;
using Medico.IoC;
using Medico.Logging.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.IO;
using System.Linq;
using System.Text;
using System;
using Dapper;
using Microsoft.AspNetCore.SpaServices.AngularCli;

namespace Medico.Api
{
    public class Startup
    {
        private const string MedicoPolicyName = "MedicoPolicy";

        private readonly IHostEnvironment _environment;
        private const string ClientSecretFilenameKey = "appsettings.Development.json";
        public Startup(IHostEnvironment environment)
        {
            _environment = environment;

            Configuration = new ConfigurationBuilder()
                .SetBasePath(environment.ContentRootPath)
                .AddJsonFile("appsettings.json", true, true)
                .AddJsonFile($"appsettings.{environment.EnvironmentName}.json", true)
                .AddEnvironmentVariables().Build();
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddHostedService<MedicationsUpdateHostedService>();
            // services.AddHostedService<EmailImportingService>();

            services.AddDbContext<IdentityDbContext>(options =>
                options.UseSqlServer(Configuration.GetConnectionString("DefaultConnection")));
            services.AddDbContext<IdentityDbContext>(options =>
                options.UseSqlServer(Configuration.GetConnectionString("newConnection")));

            services.AddLoggingDatabaseConfiguration(Configuration);

            services.AddIdentity<ApplicationUser, IdentityRole>()
                .AddEntityFrameworkStores<IdentityDbContext>()
                .AddDefaultTokenProviders();

            services.Configure<IdentityOptions>(options =>
            {
                options.User.RequireUniqueEmail = false;

                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireNonAlphanumeric = true;
                options.Password.RequireUppercase = true;
                options.Password.RequiredLength = 6;
                options.Password.RequiredUniqueChars = 1;
            });

            var allowedHosts = Configuration.GetSection("CORSSettings:AllowedHosts")
                .Get<string[]>();

            services.AddCors(options =>
            {
                options.AddPolicy(MedicoPolicyName,
                    builder => builder.WithOrigins(allowedHosts)
                        .AllowAnyMethod()
                        .AllowAnyHeader()
                        .AllowCredentials());
            });

            services.AddMvc(options =>
            {
                options.ModelBinderProviders.Insert(0, new DateTimeModelBinderProvider());
                options.ModelBinderProviders.Insert(1, new AppointmentDxOptionsModelBinderProvider());
                options.ModelBinderProviders.Insert(2, new DateRangeDxOptionsModelBinderProvider());
                options.ModelBinderProviders.Insert(3, new DxOptionsModelBinderProvider());
                options.ModelBinderProviders.Insert(4, new RoomDxOptionsModelBinderProvider());
                options.ModelBinderProviders.Insert(5, new TemplateDxOptionsModelBinderProvider());
                options.ModelBinderProviders.Insert(6, new UserDxOptionsModelBinderProvider());
                options.ModelBinderProviders.Insert(7, new HistoryDxOptionsModelBinderProvider());
                options.ModelBinderProviders.Insert(8, new VitalSignsDxOptionsModelBinderProvider());
                options.ModelBinderProviders.Insert(9, new CompanyDxOptionsModelBinderProvider());
                options.ModelBinderProviders.Insert(10, new PatientDxOptionsModelBinderProvider());
                options.ModelBinderProviders.Insert(11, new PhraseDxOptionsModelBinderProvider());
                options.ModelBinderProviders.Insert(12, new DocumentDxOptionsModelBinderProvider());
            });

            services.ConfigureApplicationCookie(options =>
            {
                options.AccessDeniedPath = new PathString("/api/account/forbid");
                options.Cookie.HttpOnly = true;

                if (!_environment.IsDevelopment())
                    options.Cookie.SameSite = SameSiteMode.None;

                options.LoginPath = new PathString("/api/account/login");
            });

            services.AddAutoMapperSetup();


            services.AddMvc()
                .SetCompatibilityVersion(CompatibilityVersion.Latest);

            services.AddMvc().AddNewtonsoftJson();

            // In production, the Angular files will be served from this directory
            services.AddSpaStaticFiles(configuration => { configuration.RootPath = "ClientApp/dist"; });

            //video chat
            //services.AddSignalR();

            // .NET Native DI Abstraction
            RegisterServices(services);

            // Register the Swagger generator, defining 1 or more Swagger documents
            services.AddSwaggerGen(c =>
            {
                c.DescribeAllParametersInCamelCase();
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "Medico API", Version = "v1" });
                c.ResolveConflictingActions(apiDescriptions => apiDescriptions.First());
                c.CustomSchemaIds(type => type.ToString());
            });

            // JwtBearer
            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.RequireHttpsMetadata = false;
                options.SaveToken = true;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = Configuration["Jwt:Issuer"],
                    ValidAudience = Configuration["Jwt:Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Configuration["Jwt:SecretKey"])),
                    ClockSkew = TimeSpan.Zero
                };
                services.AddCors();
            });

            services.Configure<HostOptions>(options =>
            {
                options.BackgroundServiceExceptionBehavior = BackgroundServiceExceptionBehavior.Ignore;
            });

            //services.AddAuthentication(o =>
            //{
            //    // This is for challenges to go directly to the Google OpenID Handler, so there's no
            //    // need to add an AccountController that emits challenges for Login.
            //    o.DefaultChallengeScheme = GoogleOpenIdConnectDefaults.AuthenticationScheme;
            //    // This is for forbids to go directly to the Google OpenID Handler, which checks if
            //    // extra scopes are required and does automatic incremental auth.
            //    o.DefaultForbidScheme = GoogleOpenIdConnectDefaults.AuthenticationScheme;
            //    o.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
            //})
            //.AddCookie()
            //.AddGoogleOpenIdConnect(options =>
            //{
            //    var clientInfo = (ClientInfo)services.First(x => x.ServiceType == typeof(ClientInfo)).ImplementationInstance;
            //    options.ClientId = clientInfo.ClientId;
            //    options.ClientSecret = clientInfo.ClientSecret;
            //});

            SqlMapper.AddTypeHandler(new MySqlGuidTypeHandler());
            SqlMapper.RemoveTypeMap(typeof(Guid));
            SqlMapper.RemoveTypeMap(typeof(Guid?));
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseCustomExceptionHandler();
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }

            app.UseHttpsRedirection();
            app.UseCors(MedicoPolicyName);

            app.UseRouting();

            app.UseAuthentication();
            app.UseAuthorization();
            app.UseCompanyAccess();
            app.UseCompanyPatientAccess();

            app.UseStaticFiles();

            app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = new PhysicalFileProvider(
                         Path.Combine(Directory.GetCurrentDirectory(), "Docs")),
                RequestPath = "/Docs"
            });

            if (!env.IsDevelopment())
            {
                app.UseSpaStaticFiles();
            }

            app.UseEndpoints(endpoints =>
            {
                ////video chat implementation
                //endpoints.MapHub<ChatHub>("/api/sgr/chat");
                //endpoints.MapHub<WebRtcHub>("/api/sgr/rtc");
                endpoints.MapControllerRoute(
                    name: "default",
                    pattern: "{controller}/{action=Index}/{id?}");
            });

            // Enable middleware to serve generated Swagger as a JSON endpoint.
            app.UseSwagger(c =>
            {
                c.RouteTemplate = "api/swagger/{documentName}/swagger.json";
                c.SerializeAsV2 = true;
            });

            // Enable middleware to serve swagger-ui (HTML, JS, CSS, etc.),
            // specifying the Swagger JSON endpoint.
            app.UseSwaggerUI(c =>
            {
                c.SwaggerEndpoint("/api/swagger/v1/swagger.json", "Medico API");
                c.RoutePrefix = "api/swagger";
            });


            app.UseSpa(spa =>
            {
                // To learn more about options for serving an Angular SPA from ASP.NET Core,
                // see https://go.microsoft.com/fwlink/?linkid=864501

                spa.Options.SourcePath = "ClientApp";

                if (env.IsDevelopment())
                {
                    spa.UseAngularCliServer(npmScript: "start");
                }
            });


            app.UseDeveloperExceptionPage();
        }

        private void RegisterServices(IServiceCollection services)
        {
            services.AddScoped<IUrlService, UrlService>();

            RegisterAppSettings(services);

            // Adding dependencies from another layers (isolated from Presentation)
            NativeInjectorBootstrapper.RegisterServices(services);
        }

        private void RegisterAppSettings(IServiceCollection services)
        {
            var mailSettings = Configuration.GetSection("MailSettings");
            services.Configure<SendEmailViewModel>(mailSettings);

            var azureSettings = Configuration.GetSection("AzureSettings");
            services.Configure<AzureEmailSettingModel>(azureSettings);

            var appSettings = Configuration.GetSection("MedicoSettings");
            services.Configure<MedicoSettingsViewModel>(appSettings);

            var uriSettings = Configuration.GetSection("URISettings");
            services.Configure<UriViewModel>(uriSettings);

            var featureSwitchesSettings = Configuration.GetSection("FeatureSwitchesSettings");
            services.Configure<FeatureSwitchesSettingsVm>(featureSwitchesSettings);

            var localizationSettings = Configuration.GetSection("LocalizationSettings");
            services.Configure<LocalizationSettingsVm>(localizationSettings);
        }
    }
}