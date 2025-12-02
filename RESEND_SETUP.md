# Configuration Resend pour les Invitations par Email

## Problème actuel
Avec l'adresse de test `onboarding@resend.dev`, Resend ne permet d'envoyer des emails **qu'aux adresses email vérifiées** dans votre compte.

## Solutions

### Option 1 : Ajouter des emails de test (Rapide - Pour le développement)

1. Allez sur [resend.com/emails](https://resend.com/emails)
2. Connectez-vous à votre compte
3. Allez dans **Settings** → **API Keys**
4. Dans la section **Test emails**, ajoutez les adresses email auxquelles vous voulez envoyer des invitations
5. Ces emails pourront maintenant recevoir vos invitations même avec `onboarding@resend.dev`

### Option 2 : Configurer votre propre domaine (Recommandé - Pour la production)

#### Étape 1 : Ajouter un domaine dans Resend

1. Allez sur [resend.com/domains](https://resend.com/domains)
2. Cliquez sur **Add Domain**
3. Entrez votre domaine (ex: `promethia.com` ou `app.promethia.com`)
4. Suivez les instructions pour ajouter les enregistrements DNS

#### Étape 2 : Vérifier le domaine

Ajoutez ces enregistrements DNS chez votre hébergeur (Vercel, Cloudflare, etc.) :

- **TXT** : Pour la vérification
- **MX** : Pour recevoir les emails
- **SPF** et **DKIM** : Pour l'authentification

⏱️ La propagation DNS peut prendre jusqu'à 48h (généralement quelques minutes)

#### Étape 3 : Mettre à jour le code

Une fois votre domaine vérifié, modifiez cette ligne dans `app/api/send-invite/route.ts` :

```typescript
// Remplacez
from: 'Promethia <onboarding@resend.dev>',

// Par
from: 'Promethia <noreply@votre-domaine.com>',
```

## Tester la configuration

### Test via l'API directe

```bash
curl -X POST http://localhost:3000/api/test-resend \
  -H "Content-Type: application/json" \
  -d '{"email":"votre@email.com"}'
```

### Test via l'interface

1. Démarrez une session collaborative
2. Entrez une adresse email dans le champ "Inviter par email"
3. Cliquez sur le bouton d'envoi
4. Vérifiez les erreurs affichées

## Limites Resend

### Plan gratuit
- 100 emails / jour
- 3,000 emails / mois
- Domaine de test : emails limités aux adresses vérifiées

### Plan payant (à partir de $20/mois)
- 50,000 emails / mois
- Support de domaines personnalisés illimités
- Analytics avancées

## Alternative temporaire

En attendant la configuration du domaine, vous pouvez partager les invitations via :

1. **Lien direct** : Copiez le lien d'invitation et envoyez-le par WhatsApp, Slack, etc.
2. **Code manuel** : Partagez simplement le code à 6 lettres
3. **QR Code** : Générez un QR code du lien d'invitation

## Ressources

- [Documentation Resend](https://resend.com/docs)
- [Vérification de domaine](https://resend.com/docs/dashboard/domains/introduction)
- [Support Resend](https://resend.com/support)
