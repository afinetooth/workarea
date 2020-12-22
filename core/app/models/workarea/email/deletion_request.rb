module Workarea
  module Email
    class DeletionRequest
      include ApplicationDocument
      include UrlToken

      field :email, type: String
      field :process_at, type: Time, default: -> { Time.current + Workarea.config.deletion_request_delay }
      field :completed_at, type: Time

      scope :awaiting_processing, -> { where(:process_at.lt => Time.current, complete_at: nil) }

      def completed?
        completed_at.present?
      end

      def complete!(email)
        update!(completed_at: Time.current, email: email)
      end
    end
  end
end
