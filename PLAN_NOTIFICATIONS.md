# Plan: Toast Notifications & Loading States Implementation

## Research Summary

### Toast Library Choice: **Sonner**
- **Recommended by shadcn/ui** - aligns with existing component system
- Lightweight (~2KB gzipped)
- Excellent TypeScript support
- Accessible (ARIA compliant)
- Works seamlessly with Tailwind CSS
- Simple API: `toast.success()`, `toast.error()`, etc.
- Supports promises for automatic loading/success/error states

### Current State Analysis
1. **Error Handling**: Currently errors are shown inline in form fields
2. **Loading States**: Buttons show text changes ("Signing in...") and are disabled
3. **No Global Notifications**: No toast/notification system for success/error feedback
4. **TanStack Query**: Using mutations with `isPending` state available

## Implementation Plan

### Phase 1: Install & Setup Toast System

#### 1.1 Install Dependencies
```bash
cd frontend
bun add sonner
```

#### 1.2 Add Toaster to Root Layout
- Add `<Toaster />` component from Sonner to `frontend/src/routes/__root.tsx`
- Configure position, theme, and styling to match app design

### Phase 2: Create Toast Utility Functions

#### 2.1 Create Toast Helper Module
- File: `frontend/src/lib/toast.ts`
- Functions:
  - `toast.success(message: string, options?)`
  - `toast.error(message: string, options?)`
  - `toast.info(message: string, options?)`
  - `toast.loading(message: string, options?)`
  - `toast.promise(promise, messages)` - for automatic loading/success/error

### Phase 3: Add Error Notifications

#### 3.1 Update Form Error Handling
**Files to modify:**
- `frontend/src/components/auth/LoginForm.tsx`
- `frontend/src/components/auth/SignupForm.tsx`

**Changes:**
- Keep inline field errors for validation
- Add toast notifications for:
  - Network errors
  - Server errors (GraphQL errors)
  - Authentication failures
  - Generic error messages

#### 3.2 Update GraphQL Error Handling
**File:** `frontend/src/lib/graphql.ts`

**Changes:**
- Add toast notifications for HTTP errors
- Add toast notifications for GraphQL errors

#### 3.3 Update Mutation Error Handling
**File:** `frontend/src/lib/queries.ts`

**Changes:**
- Add `onError` callbacks to mutations
- Show toast notifications for mutation failures
- Keep existing error throwing for form handling

### Phase 4: Add Success Notifications

#### 4.1 Authentication Success
- **Signup**: Show success toast before redirect
- **Login**: Show success toast before redirect
- **Logout**: Show success toast after logout

### Phase 5: Enhance Loading States

#### 5.1 Button Loading States
**Current state:** Buttons show text changes and are disabled

**Enhancements:**
- Add loading spinner icon to buttons (using lucide-react `Loader2`)
- Enhance existing `Button` component with loading prop support

**Files to modify:**
- `frontend/src/components/ui/button.tsx` (add loading state support)
- `frontend/src/components/auth/LoginForm.tsx`
- `frontend/src/components/auth/SignupForm.tsx`

#### 5.2 Loading Button Pattern
```typescript
<Button 
  type="submit" 
  disabled={isLoading}
  className="w-full"
>
  {isLoading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Signing in...
    </>
  ) : (
    "Sign In"
  )}
</Button>
```

### Phase 6: Toast Configuration & Styling

#### 6.1 Toast Configuration
- Position: Bottom-right (default) or bottom-center
- Duration: 4 seconds for success, 6 seconds for errors
- Max toasts: 3-5 visible at once
- Theme: Match app theme (light/dark mode support)

## File Structure

```
frontend/src/
├── components/
│   ├── ui/
│   │   └── button.tsx (enhanced with loading)
│   └── auth/
│       ├── LoginForm.tsx (updated with toasts)
│       └── SignupForm.tsx (updated with toasts)
├── lib/
│   ├── toast.ts (toast utility functions)
│   ├── queries.ts (updated with toast callbacks)
│   └── graphql.ts (updated with error toasts)
└── routes/
    └── __root.tsx (add Toaster component)
```

## Implementation Order

1. **Install Sonner** and add Toaster to root
2. **Create toast utility** functions
3. **Enhance Button component** with loading state
4. **Update LoginForm** with toasts and loading spinner
5. **Update SignupForm** with toasts and loading spinner
6. **Update mutations** with success/error toasts
7. **Update GraphQL error handling** with toasts
8. **Test all scenarios**
9. **Refine styling and behavior**

## Dependencies to Add

```json
{
  "dependencies": {
    "sonner": "^1.4.0"
  }
}
```

## Code Examples

### Toast Utility (`lib/toast.ts`)
```typescript
import { toast as sonnerToast } from "sonner";

export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
  info: (message: string) => sonnerToast.info(message),
  loading: (message: string) => sonnerToast.loading(message),
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => sonnerToast.promise(promise, messages),
};
```

### Enhanced Button Usage
```typescript
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

<Button disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isLoading ? "Loading..." : "Submit"}
</Button>
```

### Mutation with Toast
```typescript
const loginMutation = useMutation({
  mutationFn: async (credentials) => {
    return await graphqlRequest(LOGIN_MUTATION, credentials);
  },
  onSuccess: () => {
    toast.success("Successfully signed in!");
    navigate({ to: "/home" });
  },
  onError: (error) => {
    toast.error(error.message || "Failed to sign in");
  },
});
```

## Testing Checklist

- [ ] Signup success shows toast
- [ ] Signup error shows toast + inline error
- [ ] Login success shows toast
- [ ] Login error shows toast + inline error
- [ ] Network errors show toast
- [ ] GraphQL errors show toast
- [ ] Buttons show loading spinner during requests
- [ ] Buttons are disabled during loading
- [ ] Multiple toasts stack correctly
- [ ] Toasts dismiss correctly

## Notes

- Keep inline form errors for validation feedback (UX best practice)
- Use toasts for server/network errors and success confirmations
- Loading states should be visible and clear
- Ensure accessibility (keyboard navigation, screen reader support)
- Consider mobile responsiveness for toast positioning
