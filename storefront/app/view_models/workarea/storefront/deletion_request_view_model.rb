module Workarea
  module Storefront
    class DeletionRequestViewModel < ApplicationViewModel
      include DisplayContent

      def title
        browser_title.presence ||
          ::I18n.t('workarea.storefront.deletion_requests.heading')
      end

      private

      def content_lookup
        'deletion_request'
      end
    end
  end
end
