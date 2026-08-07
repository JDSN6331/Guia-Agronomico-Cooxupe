async function getTransporter() {
  const env = process.env;
  const host = env["SMTP_HOST"];
  const port = Number(env["SMTP_PORT"] || 587);
  const user = env["SMTP_USER"];
  const pass = env["SMTP_PASS"];

  if (host && user && pass) {
    try {
      // Carregamento dinâmico compatível com ESM / SSR em tempo de execução
      const nodemailerModule = await import("nodemailer");
      const nodemailer = nodemailerModule.default || nodemailerModule;
      if (typeof nodemailer.createTransport === "function") {
        return nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
        });
      }
    } catch (err) {
      console.warn("[SMTP Warning] Não foi possível carregar o módulo nodemailer:", err);
    }
  }
  return null;
}

export async function enviarEmailConvite(input: {
  toEmail: string;
  nome: string;
  link: string;
}): Promise<boolean> {
  const transporter = await getTransporter();
  const from = process.env["SMTP_FROM"] || "Guia Agronômico Cooxupé <nao-responder@cooxupe.com.br>";
  const subject = "Convite de acesso | Guia Agronômico Cooxupé";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #12281b; background-color: #f9fbf9; border-radius: 12px; border: 1px solid #e1e9e3;">
      <h2 style="color: #2a6e42; margin-top: 0;">Bem-vindo ao Guia Agronômico Cooxupé</h2>
      <p>Olá, <strong>${input.nome}</strong>!</p>
      <p>Você foi convidado para acessar a plataforma de Desenvolvimento Técnico Cooxupé.</p>
      <p>Para concluir o seu cadastro e criar a sua senha de acesso, clique no botão abaixo:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${input.link}" style="background-color: #2a6e42; color: #ffffff; padding: 12px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">Definir Minha Senha</a>
      </div>
      <p style="font-size: 13px; color: #555;">Se o botão acima não funcionar, copie e cole o seguinte link no seu navegador:</p>
      <p style="font-size: 13px; word-break: break-all;"><a href="${input.link}" style="color: #2a6e42;">${input.link}</a></p>
      <hr style="border: 0; border-top: 1px solid #e1e9e3; margin: 25px 0;" />
      <p style="font-size: 12px; color: #888;">Este link é válido por 48 horas. Caso você não tenha solicitado este acesso, por favor desconsidere este e-mail.</p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from,
        to: input.toEmail,
        subject,
        html,
      });
      return true;
    } catch (err) {
      console.error("[SMTP Error] Falha ao enviar e-mail via servidor SMTP:", err);
      return false;
    }
  } else {
    console.log("=================================================");
    console.log(`[E-MAIL CONVITE PARA: ${input.toEmail}]`);
    console.log(`LINK DE ACESSO: ${input.link}`);
    console.log("=================================================");
    return false;
  }
}

export async function enviarEmailRecuperacao(input: {
  toEmail: string;
  link: string;
}): Promise<boolean> {
  const transporter = await getTransporter();
  const from = process.env["SMTP_FROM"] || "Guia Agronômico Cooxupé <nao-responder@cooxupe.com.br>";
  const subject = "Recuperação de Acesso | Guia Agronômico Cooxupé";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #12281b; background-color: #f9fbf9; border-radius: 12px; border: 1px solid #e1e9e3;">
      <h2 style="color: #2a6e42; margin-top: 0;">Recuperação de Senha</h2>
      <p>Recebemos uma solicitação para redefinir a sua senha no Guia Agronômico Cooxupé.</p>
      <p>Clique no botão abaixo para definir uma nova senha:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${input.link}" style="background-color: #2a6e42; color: #ffffff; padding: 12px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">Redefinir Senha</a>
      </div>
      <p style="font-size: 13px; color: #555;">Link direto:</p>
      <p style="font-size: 13px; word-break: break-all;"><a href="${input.link}" style="color: #2a6e42;">${input.link}</a></p>
      <hr style="border: 0; border-top: 1px solid #e1e9e3; margin: 25px 0;" />
      <p style="font-size: 12px; color: #888;">Se você não solicitou a alteração de senha, ignore este e-mail.</p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from,
        to: input.toEmail,
        subject,
        html,
      });
      return true;
    } catch (err) {
      console.error("[SMTP Error] Falha ao enviar e-mail de recuperação via SMTP:", err);
      return false;
    }
  } else {
    console.log("=================================================");
    console.log(`[E-MAIL RECUPERAÇÃO PARA: ${input.toEmail}]`);
    console.log(`LINK DE RECUPERAÇÃO: ${input.link}`);
    console.log("=================================================");
    return false;
  }
}

export async function enviarEmailNotificacaoAdmin(input: {
  nomeUsuario: string;
  emailUsuario: string;
  cargoUsuario?: string;
  codigoAtivacao: string;
}): Promise<boolean> {
  const transporter = await getTransporter();
  const from = process.env["SMTP_FROM"] || "Guia Agronômico Cooxupé <onboarding@resend.dev>";
  const toAdmin = process.env["ADMIN_NOTIFY_EMAIL"] || "zeduquesneto@gmail.com";
  const subject = `[Solicitação de Acesso] ${input.nomeUsuario} | Guia Agronômico Cooxupé`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #12281b; background-color: #f9fbf9; border-radius: 14px; border: 1px solid #e1e9e3;">
      <h2 style="color: #2a6e42; margin-top: 0;">Nova Solicitação de Cadastro</h2>
      <p>Um novo usuário solicitou acesso ao <strong>Guia Agronômico Cooxupé</strong>:</p>
      
      <div style="background-color: #ffffff; padding: 16px; border-radius: 10px; border: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>Nome:</strong> ${input.nomeUsuario}</p>
        <p style="margin: 4px 0;"><strong>E-mail:</strong> ${input.emailUsuario}</p>
        <p style="margin: 4px 0;"><strong>Cargo:</strong> ${input.cargoUsuario || "Técnico Agronômico"}</p>
      </div>

      <p style="margin-top: 20px;">Código de ativação gerado para este usuário:</p>
      
      <div style="text-align: center; margin: 25px 0; background: #eef7f2; padding: 20px; border-radius: 12px; border: 2px dashed #2a6e42;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #2a6e42;">${input.codigoAtivacao}</span>
      </div>

      <p style="font-size: 13px; color: #555;">Repasse o código acima para o usuário. Ele deverá informar este código e criar a senha dele na plataforma para ativar a conta.</p>
      <hr style="border: 0; border-top: 1px solid #e1e9e3; margin: 25px 0;" />
      <p style="font-size: 12px; color: #888;">Painel de Administração do Guia Agronômico Cooxupé.</p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from,
        to: toAdmin,
        subject,
        html,
      });
      return true;
    } catch (err) {
      console.error("[SMTP Error] Falha ao enviar e-mail de notificação ao Admin via SMTP:", err);
      return false;
    }
  } else {
    console.log("=================================================");
    console.log(`[E-MAIL NOTIFICAÇÃO ADMIN PARA: ${toAdmin}]`);
    console.log(`NOVO USUÁRIO: ${input.nomeUsuario} (${input.emailUsuario})`);
    console.log(`CÓDIGO DE ATIVAÇÃO: ${input.codigoAtivacao}`);
    console.log("=================================================");
    return false;
  }
}
